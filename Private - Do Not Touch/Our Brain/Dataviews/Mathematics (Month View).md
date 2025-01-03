
```dataview
TABLE
	tagged-concepts as "Concept(s)",
	date as "Date",
	source as "Original Source"
FROM #Mathematics  
WHERE date(datecreated).month = this.file.month
SORT date DESC
```
