---
obsidianUIMode: preview
---

Shortcuts to help in playing tabletop rpgs, either group or solo.


__
__
```js
function roll(max) { return Math.trunc(Math.random() * max + 1); }
function aPick(a) { return a[roll(a.length)-1]; }
function aPickWeight(a, wIndex, theRoll)
{
	wIndex = wIndex || 1;
	theRoll = theRoll || roll(a.last()[wIndex]);
	for (let i = 0; i < a.length; i++)
	{
		if (a[i][wIndex] >= theRoll)
		{
			return a[i];
		}
	}
	return a.last();
}
```
__
Some useful functions


__
```
^tbl potion$
```
__
```js
let potion_common = [
"| [[Assassin's Blood]] | common | potion | 50 gp | ",
"| [[Basic Poison (vial)]] | common | potion | 50 gp | ",
"| [[Biza's Breath]] | common | potion | 50 gp | ",
"| [[Bottled Breath]] | common | potion | 50 gp | ",
"| [[Essence of Ether]] | none | adventuring gear, poison (ingested) | 150 gp | ",
"| [[Ivana's Whisper]] | none | adventuring gear, poison | 100 gp | ",
"| [[Malice]] | none | adventuring gear, poison (inhaled) | 200 gp | ",
"| [[Midnight Tears]] | none | adventuring gear, poison (inhaled) | 500 gp | ",
"| [[Oil of Etherealness]] | none | adventuring gear, poison (contact) | 200 gp | ",
"| [[Oil of Sharpness]] | none | adventuring gear, poison (injury) | 200 gp | ",
"| [[Oil of Slipperiness]] | none | adventuring gear, poison (inhaled) | 300 gp | ",
"| [[Oil of Taggit]] | none | adventuring gear, poison (inhaled) | 250 gp | ",
"| [[Pale Tincture]] | none | adventuring gear, poison (ingested) | 1,500 gp | ",
"| [[Philter of Love]] | none | adventuring gear, poison (contact) | 400 gp | ",
"| [[Poisoner's Kit]] | none | adventuring gear, poison (ingested) | 250 gp | ",
"| [[Potion of Acid Resistance]] | none | tools | 50 gp | ",
"| [[Potion of Advantage]] | none | adventuring gear, poison (injury) | 2,000 gp | ",
"| [[Potion of Animal Friendship]] | none | adventuring gear, poison (injury) | 200 gp | ",
"| [[Potion of Aqueous Form]] | none | adventuring gear, poison (ingested) | 600 gp | ",
"| [[Potion of Clairvoyance]] | none | adventuring gear, poison (ingested) | 150 gp | ",
"| [[Potion of Climbing]] | none | adventuring gear, poison (injury) | 1,200 gp | ",
"| [[Potion of Cloud Giant Strength]] | rare | potion | 2500 gp | ",
"| [[Potion of Cold Resistance]] | rare | potion | 2500 gp | ",
"| [[Potion of Comprehension]] | rare | potion | 2500 gp | ",
"| [[Potion of Diminution]] | rare | potion | 2500 gp | ",
"| [[Potion of Dragon's Majesty]] | rare | potion | 2500 gp | ",
"| [[Potion of Fire Breath]] | rare | potion | 2500 gp | ",
"| [[Potion of Fire Giant Strength]] | rare | potion | 2500 gp | ",
"| [[Potion of Fire Resistance]] | rare | potion | 2500 gp | ",
"| [[Potion of Flying]] | rare | potion | 2500 gp | ",
"| [[Potion of Force Resistance]] | rare | potion | 2500 gp | ",
"| [[Potion of Frost Giant Strength]] | rare | potion | 2500 gp | ",
"| [[Potion of Gaseous Form]] | rare | potion | 2500 gp | ",
"| [[Potion of Giant Size]] | rare | potion | 2500 gp | ",
"| [[Potion of Giant Strength]] | rare | potion | 2500 gp | ",
"| [[Potion of Greater Healing]] | rare | potion | 2500 gp | ",
"| [[Potion of Growth]] | rare | potion | 2500 gp | ",
"| [[Potion of Healing]] | uncommon | potion | 250 gp | ",
"| [[Potion of Healing (*)]] | uncommon | potion | 250 gp | ",
"| [[Potion of Heroism]] | uncommon | potion | 250 gp | ",
"| [[Potion of Hill Giant Strength]] | uncommon | potion | 250 gp | ",
"| [[Potion of Invisibility]] | uncommon | potion | 250 gp | ",
"| [[Potion of Invulnerability]] | uncommon | potion | 250 gp | ",
"| [[Potion of Lightning Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Longevity]] | uncommon | potion | 250 gp | ",
"| [[Potion of Maximum Power]] | uncommon | potion | 250 gp | ",
"| [[Potion of Mind Control]] | uncommon | potion | 250 gp | ",
"| [[Potion of Mind Control (beast)]] | uncommon | potion | 250 gp | ",
"| [[Potion of Mind Control (humanoid)]] | uncommon | potion | 250 gp | ",
"| [[Potion of Mind Control (monster)]] | uncommon | potion | 250 gp | ",
"| [[Potion of Mind Reading]] | uncommon | potion | 250 gp | ",
"| [[Potion of Necrotic Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Poison]] | uncommon | potion | 250 gp | ",
"| [[Potion of Poison Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Possibility]] | uncommon | potion | 250 gp | ",
"| [[Potion of Psychic Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Radiant Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Resistance]] | uncommon | potion | 250 gp | ",
"| [[Potion of Speed]] | uncommon | potion | 250 gp | "
];
let potion_rare = [
"| [[Potion of Cloud Giant Strength]] | rare | potion | 0 | ",
"| [[Potion of Cold Resistance]] | rare | potion | 0 | ",
"| [[Potion of Comprehension]] | rare | potion | 0 | ",
"| [[Potion of Diminution]] | rare | potion | 0 | ",
"| [[Potion of Dragon's Majesty]] | rare | potion | 0 | ",
"| [[Potion of Fire Breath]] | rare | potion | 0 | ",
"| [[Potion of Fire Giant Strength]] | rare | potion | 0 | ",
"| [[Potion of Fire Resistance]] | rare | potion | 0 | ",
"| [[Potion of Flying]] | rare | potion | 0 | ",
"| [[Potion of Force Resistance]] | rare | potion | 0 | ",
"| [[Potion of Frost Giant Strength]] | rare | potion | 0 | ",
"| [[Potion of Gaseous Form]] | rare | potion | 0 | ",
"| [[Potion of Giant Size]] | rare | potion | 0 | ",
"| [[Potion of Giant Strength]] | rare | potion | 0 | ",
"| [[Potion of Greater Healing]] | rare | potion | 0 | ",
"| [[Potion of Growth]] | rare | potion | `= [[Potion of Growth]].basecost * [[World Configuration]].NormalCost` | "
];
let potion_veryrare = [
"| [[Potion of Storm Giant Strength]] | varies | potion | 3000 gp | ",
"| [[Potion of Superior Healing]] | varies | potion | 3000 gp | ",
"| [[Potion of Supreme Healing]] | varies | potion | 3000 gp | ",
"| [[Potion of Thunder Resistance]] | very rare | potion | 3000 gp | ",
"| [[Potion of Vitality]] | very rare | potion | 3000 gp | ",
"| [[Potion of Watchful Rest]] | very rare | potion | 3000 gp | ",
"| [[Potion of Water Breathing]] | very rare | potion | 3000 gp | ",
"| [[Purple Worm Poison]] | very rare | potion | 3000 gp | ",
"| [[Serpent Venom]] | very rare | potion | 3000 gp | ",
"| [[Torpor]] | very rare | potion | 3000 gp | ",
"| [[Truth Serum]] | very rare | potion | 3000 gp | ",
"| [[Witchlight Vane]] | very rare | potion | 3000 gp | ",
"| [[Wyvern Poison]] | very rare | potion | 3000 gp | ",
"| [[Burnt Othur Fumes]] | legendary | potion | 62500 gp | ",
"| [[Carrion Crawler Mucus]] | legendary | potion | 62500 gp | ",
"| [[Drow Poison]] | legendary | potion | 62500 gp | ",
"| [[Elixir of Health]] | legendary | 0 | 62500 gp | "
];
return [ "#### Potions For Sale\n\n", 
"| Potion | Rarity | Type  | Price |  \n",
"| ---- | ---- | --- | ------ | \n",
"| [[Potion of Growth]] | rare | potion | `= [[Potion of Growth]].basecost * [[World Configuration]].NormalCost` | \n",
aPick(potion_common), "\n", 
aPick(potion_common), "\n",
aPick(potion_common), "\n",
aPick(potion_common), "\n",
aPick(potion_common), "\n",
aPick(potion_common), "\n",
aPick(potion_rare), "\n",
aPick(potion_rare), "\n",
aPick(potion_rare), "\n",
aPick(potion_veryrare), "\n",
	   ] 

```
__
tbl potion - Random table: 10x Random Potions