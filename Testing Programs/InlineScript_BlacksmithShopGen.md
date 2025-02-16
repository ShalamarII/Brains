__


```
^getShop ([_a-zA-Z][_a-zA-Z0-9]*) ([1-9][0-9]*)$
```
__
```js
let data = expand(
    "notepick pickFromFolderAndGetFrontmatter " +
    "GURPSGeneration/Shops\ " + 1);

if (!data)
{
    return "Unable to get " + $1 + " item(s).";
}
data = Object.keys(data).map(v => Object.assign({ noteName: v }, data[v] ));

//Table of Usable Races
shops = ["blacksmith", "armourer", "clothier", "general"];

// Create a table from the front matter
result = "| Name | Cost | Reach / Range | Rate of Fire | Bulk (Penalty to M&A) | Damage | Recoil | ST |\n| ---- | ---- | ---- | ---- | ---- | ---- | ---- | ---- |\n";

let baseDocumentNum = 0;
randomChecker =  $1

if (!$2) {
    $2 = 10
}

console.log("This is $2: ", $2);
//Item Iteration
for (let i = 0; i < $2; i++)
{
    console.log(data[i]);
    console.log("This is i: ", i);
    console.log("This is $1: ", typeof $1, $1);
    console.log("This is $2: ", typeof $2, $2);

    // item = The actual item itself
    // prefix = base modifiers like material
    // property = modifiers like fine, cracked, etc.

    let itemNum = data[baseDocumentNum][`${$1.toLowerCase()}Items`].length;
    //let materialNum = data[baseDocumentNum][`${$1.toLowerCase()}Materials`].length;
    
    //console.log("This is itemNum: ", materialNum)

    let randItem = Math.floor(Math.random() * itemNum);
    //let randMaterial = Math.floor(Math.random() * materialNum);
    console.log("this is randItem: ", randItem);

    /*
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
    */
    // Create a Array shorthand
    itemObj = data[baseDocumentNum][`${$1.toLowerCase()}Items`];
    //materialObj = data[baseDocumentNum][`${$1.toLowerCase()}Materials`];


    // Shorthand for the "Array in a list"
    itemF = itemObj[randItem]
    //materialF = materialObj[randMaterial][randMaterial]
    
    //Formulate table
    result +=
   	 "| " +
   	 itemF.name + " | " +
   	 itemF.cost  + " | " +
   	 itemF.reach + " | " +
   	 itemF.RoF + " | " +
   	 itemF.bulk + " | " +
   	 itemF.damage + " | " +
   	 itemF.recoil + " | " +
   	 itemF.STreq
      
    result += " |\n";
   	 
}
return result + "\n";
```
__
getShop {ShopType: blacksmith, armourer, clothier, general} {itemCount: >0} - Generates a random shop from the list of items.