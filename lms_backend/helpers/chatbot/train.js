const fs = require("fs");
const path = require("path");
const { NlpManager } = require("node-nlp");

const manager = new NlpManager({ languages: ["en"] });
const intentsDir = path.join(__dirname, "intents");
const files = fs.readdirSync(intentsDir);

for (const file of files) {
  let data = fs.readFileSync(path.join(intentsDir, file));
  data = JSON.parse(data);

  for (const intentData of data) {
    const { intent, category, questions, answers } = intentData;
  
    // Combine the category and intent name
    const combinedIntent = `${category}_${intent}`;
    
    console.log(`Processing intent: ${combinedIntent}`);
  
    // Add questions as documents
    for (const question of questions) {
      manager.addDocument("en", question, combinedIntent);
    }
  
    // Add answers
    for (const answer of answers) {
      manager.addAnswer("en", combinedIntent, answer);
    }
  }
}

// Train and save the model
(async () => {
  console.log('Training the model...');
  await manager.train();
  console.log('Model trained. Saving...');
  await manager.save(path.join(__dirname, 'model.nlp'));
  console.log('Model saved successfully.');
})();