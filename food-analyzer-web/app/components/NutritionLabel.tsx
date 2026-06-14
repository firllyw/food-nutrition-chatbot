import React from 'react';

export default function NutritionLabel({ data }: { data: any }) {
  if (data.foodClassification === "NON_FOOD") {
    return (
      <div style={{ color: 'red', fontWeight: 'bold' }}>
        {data.refusalMessage || "This does not appear to be food."}
      </div>
    );
  }

  const { labelData, foodName } = data;
  if (!labelData) return <div>No nutrition data available.</div>;

  return (
    <div>
      <p style={{fontStyle: 'italic', marginBottom: '0.5rem'}}>Identified as: {foodName}</p>
      <div className="nutrition-label">
        <header>
          <h1>Nutrition Facts</h1>
        </header>
        
        <div className="servings">
          <div>{labelData.servingsPerContainer} servings per container</div>
          <div style={{fontWeight: 'bold', fontSize: '1.2rem', display: 'flex', justifyContent: 'space-between'}}>
            <span>Serving size</span>
            <span>{labelData.servingSize?.description || `${labelData.servingSize?.value} ${labelData.servingSize?.unit}`}</span>
          </div>
        </div>

        <div className="calories">
          <div>
            <h2>Amount per serving</h2>
            <div className="amount">Calories</div>
          </div>
          <div className="amount">{labelData.calories}</div>
        </div>

        <div className="daily-value">% Daily Value*</div>

        <div className="nutrient-row">
          <div><span className="nutrient-name">Total Fat</span> {labelData.totalFatG?.value}g</div>
          <div><span className="nutrient-name">{labelData.totalFatG?.percentageDV}%</span></div>
        </div>
        
        <div className="nutrient-row indented">
          <div><span className="nutrient-name normal">Saturated Fat</span> {labelData.saturatedFatG?.value}g</div>
          <div><span className="nutrient-name">{labelData.saturatedFatG?.percentageDV}%</span></div>
        </div>
        
        <div className="nutrient-row indented">
          <div><span className="nutrient-name normal">Trans Fat</span> {labelData.transFatG}g</div>
        </div>

        <div className="nutrient-row">
          <div><span className="nutrient-name">Cholesterol</span> {labelData.cholesterolMg?.value}mg</div>
          <div><span className="nutrient-name">{labelData.cholesterolMg?.percentageDV}%</span></div>
        </div>

        <div className="nutrient-row">
          <div><span className="nutrient-name">Sodium</span> {labelData.sodiumMg?.value}mg</div>
          <div><span className="nutrient-name">{labelData.sodiumMg?.percentageDV}%</span></div>
        </div>

        <div className="nutrient-row">
          <div><span className="nutrient-name">Total Carbohydrate</span> {labelData.totalCarbohydrateG?.value}g</div>
          <div><span className="nutrient-name">{labelData.totalCarbohydrateG?.percentageDV}%</span></div>
        </div>

        <div className="nutrient-row indented">
          <div><span className="nutrient-name normal">Dietary Fiber</span> {labelData.dietaryFiberG?.value}g</div>
          <div><span className="nutrient-name">{labelData.dietaryFiberG?.percentageDV}%</span></div>
        </div>

        <div className="nutrient-row indented">
          <div><span className="nutrient-name normal">Total Sugars</span> {labelData.totalSugarsG?.value}g</div>
        </div>
        
        <div className="nutrient-row indented">
          <div><span className="nutrient-name normal">Includes {labelData.includesAddedSugarsG?.value}g Added Sugars</span></div>
          <div><span className="nutrient-name">{labelData.includesAddedSugarsG?.percentageDV}%</span></div>
        </div>

        <div className="nutrient-row thick-border">
          <div><span className="nutrient-name">Protein</span> {labelData.proteinG}g</div>
        </div>

        {labelData.micronutrients && labelData.micronutrients.map((micro: any, index: number) => (
          <div className="nutrient-row" key={index}>
            <div>{micro.name} {micro.valueMcg ? `${micro.valueMcg}mcg` : `${micro.valueMg}mg`}</div>
            <div>{micro.percentageDV}%</div>
          </div>
        ))}

        <div style={{fontSize: '0.65rem', marginTop: '0.5rem', borderTop: '1px solid black', paddingTop: '0.25rem'}}>
          * The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.
        </div>
      </div>
    </div>
  );
}
