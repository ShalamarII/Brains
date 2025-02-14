__


```
^getNewPlant ([1-9][0-9]*)$
```
__
```js
let data = expand(
    "notepick pickFromFolderAndGetFrontmatter " +
    "GURPSGeneration/Plants\ " + 1);
if (!data)
{
    return "Unable to get " + $1 + " item(s).";
}
data = Object.keys(data).map(v => Object.assign({ noteName: v }, data[v] ));

// Create a table from the front matter
result = "| Classification | Descriptor Word | Descriptor Word 2 | Color | Texture | Smell | Smell Intensity | Taste | Look | Best Cooking Method | Ingested Effects | Behaviors | Potion Effects |\n| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |\n";

let baseDocumentNum = 0

for (let i = 0; i < $1; i++)
{

    let rand0 = Math.floor(Math.random() * data[baseDocumentNum].classification.length);
    let rand1 = Math.floor(Math.random() * data[baseDocumentNum].descriptorWords.length);
    let rand2 = Math.floor(Math.random() * data[baseDocumentNum].descriptorWords.length);
    let rand3 = Math.floor(Math.random() * data[baseDocumentNum].color.length);
    let rand4 = Math.floor(Math.random() * data[baseDocumentNum].texture.length);
    let rand5 = Math.floor(Math.random() * data[baseDocumentNum].smell.length);
    let rand6 = Math.floor(Math.random() * data[baseDocumentNum].smellIntensity.length);
    let rand7 = Math.floor(Math.random() * data[baseDocumentNum].taste.length);
    let rand8 = Math.floor(Math.random() * data[baseDocumentNum].visual.length);
    let rand9 = Math.floor(Math.random() * data[baseDocumentNum].cookingMethod.length);
    let rand10 = Math.floor(Math.random() * data[baseDocumentNum].plantEffects.length);
    let rand11 = Math.floor(Math.random() * data[baseDocumentNum].plantBehaviors.length);
    let rand12 = Math.floor(Math.random() * data[baseDocumentNum].potionEffects.length);
    
    result +=
   	 "| " +
   	 data[baseDocumentNum].classification[rand0] + " | " +
   	 data[baseDocumentNum].descriptorWords[rand1] + " | " +
   	 data[baseDocumentNum].descriptorWords[rand2] + " | " +
   	 data[baseDocumentNum].color[rand3] + " | " +
   	 data[baseDocumentNum].texture[rand4] + " | " +
   	 data[baseDocumentNum].smell[rand5] + " | " +
   	 data[baseDocumentNum].smellIntensity[rand6] + " | " +
   	 data[baseDocumentNum].taste[rand7] + " | " +
   	 data[baseDocumentNum].visual[rand8] + " | " +
   	 data[baseDocumentNum].cookingMethod[rand9] + " | " +
   	 data[baseDocumentNum].plantEffects[rand10] + " | " +
   	 data[baseDocumentNum].plantBehaviors[rand11] + " | " +
   	 data[baseDocumentNum].potionEffects[rand12]
    + " |\n";
   	 
}
return result + "\n";
```
__
getNewPlant {count: >0} - Generates a random plant from the list of words.