
```dataview
TABLE
	topic as "Topic",
	summary as "Summary",
	date as "Date",
	type as "Type"
FROM #ShareWithVeronica 
WHERE date(datecreated).month = this.file.month
SORT date DESC
```
