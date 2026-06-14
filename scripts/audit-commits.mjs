import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Define the number of weeks to look back
const WEEKS_BACK = 2;

const SYSTEM_PROMPT = `You are an expert full-stack security and architecture auditor specializing in Next.js (App Router, Server Actions, API Routes) and the Prisma ORM. Your task is to conduct a ruthless, deep-dive code audit of the provided application files. 

Do not generate summaries or praise. Focus entirely on identifying vulnerabilities, concurrency flaws, and poor architectural decisions.

Please scan the codebase and evaluate it against the following strict criteria:

### 1. Next.js & Server API Security
Scan all API routes and Server Actions for the following vulnerabilities:
* **Missing Authorization & Authentication:** Ensure every single Server Action and API route explicitly verifies the user's session and checks role-based permissions before executing logic. Do not assume a request is authenticated just because it originates from a protected UI component.
* **Input Validation:** Flag any endpoint lacking rigorous server-side validation (e.g., Zod schemas). Client-side validation is completely insufficient.
* **Secret Leakage:** Identify any environment variables prefixed with \`NEXT_PUBLIC_\` that contain sensitive keys (e.g., database URLs, secret tokens, service role keys).
* **Closure Vulnerabilities:** Check if Server Actions capture sensitive environment variables in closures instead of being securely isolated in dedicated \`use server\` files.
* **CSRF & Origin Checks:** Verify that state-changing API endpoints validate the \`Origin\` header and that sensitive actions are properly rate-limited.

### 2. Prisma DB & Inventory Movement Logic
Inventory systems are highly susceptible to race conditions and lost updates. Audit the database operations, specifically targeting inventory movement:
* **Race Conditions (Read-Modify-Write):** Flag any logic that reads an inventory balance into memory, calculates the new balance in JavaScript, and writes it back. This pattern will fail under concurrent load.
* **Transaction Isolation:** Ensure multi-step inventory movements (e.g., deducting from warehouse A, adding to warehouse B, writing an audit log) are wrapped in interactive transactions (\`prisma.$transaction\`). Check that the \`isolationLevel\` is explicitly set to \`Serializable\` to prevent concurrent write conflicts.
* **Atomic Operations:** Require the replacement of read-modify-write patterns with native atomic operations (\`increment\`, \`decrement\`) wherever applicable.
* **Deadlock Handling:** Verify that the code catches Prisma \`P2034\` (write conflict/deadlock) errors and implements a safe retry mechanism for inventory transactions.

### 3. AI Coding Agent Fallback Patterns
Coding agents often leave behind lazy, "happy-path" code. Scan the codebase for the following anti-patterns:
* **Type Evasion:** Flag any use of \`@ts-ignore\`, \`@ts-expect-error\`, or \`any\` types—especially in database payloads, API responses, or form data parsing.
* **Placeholder Logic:** Identify inline comments like \`// TODO: add validation later\`, hardcoded mock data bypassing real DB queries, or returning success responses before the database write is confirmed.
* **Blind Error Swallowing:** Catch \`catch (e) { console.log(e) }\` blocks that fail to return proper HTTP error codes or fail to trigger transaction rollbacks.
* **UI-Coupled Logic:** Flag database queries or heavy business logic executed directly inside React components instead of being properly abstracted to a separate Data Access Layer.

### 4. Required Output Format
Provide your audit results categorized by file. For each issue found, you must output:
1. **Location:** The exact line number and function name.
2. **Vulnerability/Flaw:** A concise explanation of why it is a security risk, logic bug, or lazy pattern.
3. **The Fix:** The exact, refactored code block required to solve the issue.`;

async function callGeminiAPI(diff, hash, message) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.AI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new Error('Missing GEMINI_API_KEY environment variable.');
  }

  const payload = {
    systemInstruction: {
      parts: [{ text: SYSTEM_PROMPT }]
    },
    contents: [
      {
        role: "user",
        parts: [{ text: `Please audit the following commit diff. Commit Hash: ${hash}\nMessage: ${message}\n\nDiff:\n\`\`\`diff\n${diff}\n\`\`\`` }]
      }
    ],
    generationConfig: {
      temperature: 0.2
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`API Request failed: ${response.status} ${response.statusText}\n${errText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`API returned error: ${JSON.stringify(data.error)}`);
  }
  return data.candidates[0].content.parts[0].text;
}

async function scanCommit(diff, hash, message) {
  return await callGeminiAPI(diff, hash, message);
}

async function runAudit() {
  console.log('🔄 Executing git pull...');
  try {
    execSync('git pull origin master', { stdio: 'inherit' });
  } catch (error) {
    console.error('❌ Git pull failed. Please check your repository status.');
    process.exit(1);
  }

  console.log(`\n📅 Finding commits from the past ${WEEKS_BACK} weeks...`);
  let commitLogs = '';
  try {
    // Get commit hashes and messages
    commitLogs = execSync(`git log --since="${WEEKS_BACK} weeks ago" --format="%H|%s"`, { encoding: 'utf-8' }).trim();
  } catch (error) {
    console.error('❌ Failed to retrieve git history.');
    process.exit(1);
  }

  if (!commitLogs) {
    console.log(`✅ No commits found in the past ${WEEKS_BACK} weeks. Nothing to audit.`);
    return;
  }

  const commits = commitLogs.split('\n').map(line => {
    const separatorIdx = line.indexOf('|');
    return {
      hash: line.substring(0, separatorIdx),
      message: line.substring(separatorIdx + 1)
    };
  });

  console.log(`🔍 Found ${commits.length} commit(s) to analyze.`);

  const auditDir = join(process.cwd(), 'audits');
  if (!existsSync(auditDir)) {
    mkdirSync(auditDir);
    console.log('📁 Created "audits" directory.');
  }

  for (let i = 0; i < commits.length; i++) {
    const { hash, message } = commits[i];
    console.log(`\n[${i + 1}/${commits.length}] Analyzing commit ${hash.substring(0, 7)}: ${message}`);

    const outputFile = join(auditDir, `${hash}.md`);
    if (existsSync(outputFile)) {
      console.log(`⏭️  Audit already exists for ${hash.substring(0, 7)}. Skipping.`);
      continue;
    }

    try {
      // Get the diff for the commit using git show (this shows the changes made in this specific commit)
      const diff = execSync(`git show --oneline ${hash}`, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 }); // 10MB buffer for large diffs

      // We should check if the diff is empty or too large. For now, we assume it's reasonable.
      // Call the AI
      console.log('⏳ Requesting AI audit...');
      const analysis = await scanCommit(diff, hash, message);

      const markdownContent = `# Audit Report for Commit: ${hash.substring(0, 7)}
**Full Hash:** \`${hash}\`
**Message:** ${message}
**Date Audited:** ${new Date().toISOString()}

## AI Security & Architecture Audit
${analysis}
`;

      writeFileSync(outputFile, markdownContent, 'utf-8');
      console.log(`✅ Saved analysis to ${outputFile}`);
    } catch (error) {
      console.error(`❌ Failed to analyze commit ${hash.substring(0, 7)}: ${error.message}`);
    }
  }

  console.log('\n🎉 Audit process complete! Check the "audits" folder for results.');
}

runAudit().catch(err => {
  console.error('Fatal error running audit process:', err);
  process.exit(1);
});
