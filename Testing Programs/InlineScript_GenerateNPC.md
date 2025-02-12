__


```
^getNewNPC ([1-9][0-9]*) ?([_a-zA-Z][_a-zA-Z0-9]*)$
```
__
```js
let data = expand(
    "notepick pickFromFolderAndGetFrontmatter " +
    "GURPSGeneration/NPCS\ " + 1);

if (!data)
{
    return "Unable to get " + $1 + " item(s).";
}
data = Object.keys(data).map(v => Object.assign({ noteName: v }, data[v] ));

//Table of Usable Races
races = ["human", "orc", "kathali"];

// Create a table from the front matter
result = "| Name | Race | Attribute Level | Descriptor Word | Eye Color | Behaviors | Flaws | Strengths | Traits | Low Level Quests | Mid Level Quests | Vularis Quests | Profession | Special Race Traits |\n| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |\n";

let baseDocumentNum = 0;
$1 = Number($1);
randomChecker =  $2


for (let i = 0; i < $1; i++)
{
    console.log(data[i]);
    console.log("This is i: ", i);
    console.log("This is $1: ", typeof $1, $1);
    console.log("This is $2: ", typeof $2, $2);

    switch ($2.toLowerCase()){
        case "random":
            racePicker = Math.floor(Math.random() * races.length);
            randomRace = races[racePicker];
            console.log("Random: ", randomRace);
            break;
        default:
         randomRace = $2.toLowerCase();
         console.log(randomRace);
    };

    let rand0 = Math.floor(Math.random() * data[baseDocumentNum][`${randomRace.toLowerCase()}FirstNames`].length);
    let rand1 = Math.floor(Math.random() * data[baseDocumentNum][`${randomRace.toLowerCase()}LastNames`].length);
    let rand2 = Math.floor(Math.random() * data[baseDocumentNum].persAttributes.length);
    let rand3 = Math.floor(Math.random() * data[baseDocumentNum].physFeatures.length);
    let rand4 = Math.floor(Math.random() * data[baseDocumentNum].physFeatures.length);
    let rand5 = Math.floor(Math.random() * data[baseDocumentNum].persEyeColors.length);
    let rand6 = Math.floor(Math.random() * data[baseDocumentNum].persBehaviors.length);
    let rand7 = Math.floor(Math.random() * data[baseDocumentNum].persFlaws.length);
    let rand8 = Math.floor(Math.random() * data[baseDocumentNum].persStrengths.length);
    let rand9 = Math.floor(Math.random() * data[baseDocumentNum].persTraits.length);
    let rand10 = Math.floor(Math.random() * data[baseDocumentNum].persLowQuests.length);
    let rand11 = Math.floor(Math.random() * data[baseDocumentNum].persMidQuests.length);
    let rand12 = Math.floor(Math.random() * data[baseDocumentNum].persVularisQuests.length);
    let rand13 = Math.floor(Math.random() * data[baseDocumentNum].persProfession.length);
    let rand14 = Math.floor(Math.random() * 100);
    let rand15 = Math.floor(Math.random() * 100);

    //Start Table With Name
    result +=
   	 "| " +
   	 data[baseDocumentNum][`${randomRace.toLowerCase()}FirstNames`][rand0] + " " +
   	 data[baseDocumentNum][`${randomRace.toLowerCase()}LastNames`][rand1] + " | ";

     // Insert Race Name
     result += `${randomRace.charAt(0).toUpperCase() + randomRace.slice(1)}`  + " | "

   	result +=
   	 data[baseDocumentNum].persAttributes[rand2] + " | " +
   	 data[baseDocumentNum].physFeatures[rand3] + ", " +
   	 data[baseDocumentNum].physFeatures[rand4] + " | " +
   	 data[baseDocumentNum].persEyeColors[rand5] + " | " +
   	 data[baseDocumentNum].persBehaviors[rand6] + " | " +
   	 data[baseDocumentNum].persFlaws[rand7] + " | " +
   	 data[baseDocumentNum].persStrengths[rand8] + " | " +
   	 data[baseDocumentNum].persTraits[rand9] + " | " +
   	 data[baseDocumentNum].persLowQuests[rand10] + " | " +
   	 data[baseDocumentNum].persMidQuests[rand11] + " | " +
   	 data[baseDocumentNum].persVularisQuests[rand12] + " | " +
   	 data[baseDocumentNum].persProfession[rand13] + " | " +
     data[baseDocumentNum][`${randomRace.toLowerCase()}Traits`][rand14] + " , " +
     data[baseDocumentNum][`${randomRace.toLowerCase()}Traits`][rand15]
      
    result += " |\n";
   	 
}
return result + "\n";
```
__
getNewNPC {count: 1} {Race:} - Generates a random human from the list of words.