import * as FCore from "../CoreVersionComp.js";

//CONSTANTS
const cGradtoRad = Math.PI/180;

const chexfactor = Math.cos(30 * cGradtoRad);

const cxid = 0;
const cyid = 1;

//forms
const cTokenFormCircle = "TokenFormCircle";
const cTokenFormRectangle = "TokenFormRectangle";

const cTokenForms = [cTokenFormCircle, cTokenFormRectangle];

export {cTokenForms, cGradtoRad}

class GeometricUtils {
	//DECLARATIONS
	//basics
	static Rotated(pPosition, protation) {} //gives px, py rotated by protation[degrees]
	
	static NormalAngle(pDirection) {} //returns the angle of pDirection compared to [0, 1] (normal start vision angle)
	
	static CenterPosition(pToken) {} //returns the position of the Center of pToken
	
	static liveCenterPosition(pToken) {} //returns a live ptoken center position (based on animation)
	
	static CenterPositionXY(pToken) {} //returns the center position of pToken
	
	static CenterPositionWall(pWall) {} //returns the position of the Center of pWall
	
	static CenterPositionObject(pObject) {} //returns the center position of pObject
	
	static NewCenterPosition(pDocument, pChanges) {} //returns the new position of the Center of pDocument (usefull for updates)
	
	static Difference(pPositionA, pPositionB) {} //returns the x and y differenc of pPositionA to pPositionB (x-y arrays)
	
	static Differencefromxy(pPositionA, pPositionB) {} //returns the x and y differenc of pPositionA to pPositionB (x-y arrays) (from x,y objects)
	
	static Summ(pPositionA, pPositionB) {} //returns the summ of both points
	
	static isEqual(pPositionA, pPositionB) {} //returns of both position are equal
	
	static TokenDifference(pTokenA, pTokenB) {} //returns the x and y differenc of pTokenA to pTokenB (x-y arrays)
	
	static value(pVector) {} //returns the pythagoras value
	
	static average(pVectors) {} //returns the average of pVectors
	
	static scale(pNumberArray, pfactor) {} //scales pNumberarray by pfactor
	
	static scalexy(pNumberArray, pfactorarray) {} //scales pNumberarray by pfactorarray (position by position)
	
	static scaleto(pVector, pfactor) {} //scales pVector to pfactor length
	
	static scaletoxy(pVector, pfactorarray) {} //scales pVector to a new vector in the same direction but with pfactorarray as max value in x/y (ellipses)
	
	static norm(pVector) {} //returns pVector normed to 1
	
	static Direction(pPositionA, pPositionB) {} //returns (x-y array) with the relativ direction of pPositionA to pPositionB(normed to one)
	
	static Distance(pPositionA, pPositionB) {} //returns the distance between position A nad B
	
	static DistanceXY(pPositionA, pPositionB) {} //returns the distance between points A nad B
	
	static DistanceXYZ(pPositionA, pPositionB, pElevationScale = 1) {} //returns the distance between points A nad B
	
	static scaledDistance(pPositionA, pPositionB, pfactorarray, protation = 0) {} //returns the distance between position A nad B with the x and y component scaled with pfactorarray (rotates difference before claculation if protation != 0)
	
	static TokenDistance(pTokenA, pTokenB) {} //returns (in game) Distance between Tokens
	
	static TokenBorderDistance(pTokenA, pTokenB) {} //returns (in game) Distance between Tokens from their respective borders
	
	static insceneWidth(pToken) {} //returns the tokens width in its scene
	
	static insceneHeight(pToken) {} //returns the tokens width in its scene
	
	static insceneSize(pToken) {} // returns the scene size of pTokens scene
	
	static insceneCenter(pObject) {} //returns the in scene center of pToken
	
	//sort
	static sortbymaxdim(pTokens) {} //sorts pTokens array by their largest dimensions, returns sorted array and array with their values
	
	//advanced
	static closestrelativBorderposition(pToken, pTokenForm, pDirection) {} //gives the closest position on the border of pToken in directions of (x-y array) pDirection
	
	static withinBoundaries(pToken, pTokenForm, pPosition) {} //if pPosition is with in Boundaries of pToken (with form pTokenForm)
	
	//grids
	static GridSnap(ppositon, pGridType, podd) {}//snaps ppositon to grid, podd should be an array of boolean refering to x and y (e.g. if summ of rider and ridden size is odd)
	
	//areas
	static GetArea(pTokens) {} //returns the smallest area (top, left, bttom, right) in which all pTokens lie
	
	static ScaleArea(pArea, pScale) {} //scales pArea
	
	static AreaWidth(pArea) {} //returns the width of pArea
	
	static AreaHeight(pArea) {} //returns the height of pArea
	
	//IMPLEMENTATIONS
	//basics
	static Rotated(pPosition, protation) {
		return [Math.cos(cGradtoRad * protation) * pPosition[0] - Math.sin(cGradtoRad * protation) * pPosition[1], Math.sin(cGradtoRad * protation) * pPosition[0] + Math.cos(cGradtoRad * protation) * pPosition[1]];
	}
	
	static NormalAngle(pDirection) {
		let vBasicDirection = GeometricUtils.norm(pDirection);
		
		if (pDirection[0] < 0) {
			return (Math.acos(vBasicDirection[1])) / cGradtoRad;
		}
		else {
			return ((2*Math.PI) - Math.acos(vBasicDirection[1])) / cGradtoRad;
		}
	}
	
	static CenterPosition(pToken) {
		if (pToken.center) {
			return [pToken.center.x, pToken.center.y];
		}
		else {
			return [pToken.x + GeometricUtils.insceneWidth(pToken)/2, pToken.y + GeometricUtils.insceneHeight(pToken)/2];
		}
	} 
	
	static liveCenterPosition(pToken) {
		return [pToken.object.position.x + GeometricUtils.insceneWidth(pToken)/2, pToken.object.position.y + GeometricUtils.insceneHeight(pToken)/2];
	}
	
	static CenterPositionXY(pToken) {
		return {x : pToken.position.x + pToken.w/2, y : pToken.position.y + pToken.h/2};
	}
	
	static CenterPositionWall(pWall) {
		return [(pWall.c[0] + pWall.c[2])/2, (pWall.c[1] + pWall.c[3])/2];
	} 
	
	static CenterPositionObject(pObject) {
		switch (pObject.documentName) {
			case "Wall":
				return GeometricUtils.CenterPositionWall(pObject);
				break;
			case "Token":
				return GeometricUtils.CenterPosition(pObject);
				break;
		}	
		
		return [-1,-1];
	}
	
	static NewCenterPosition(pDocument, pChanges) {
		let vPosition = [GeometricUtils.insceneWidth(pDocument)/2, GeometricUtils.insceneHeight(pDocument)/2];
		
		if (pChanges.hasOwnProperty("x")) {
			vPosition[0] = vPosition[0] + pChanges.x;
		}
		else {
			vPosition[0] = vPosition[0] + pDocument.x;
		}
		
		if (pChanges.hasOwnProperty("y")) {
			vPosition[1] = vPosition[1] + pChanges.y;
		}
		else {
			vPosition[1] = vPosition[1] + pDocument.y;
		}
		
		return vPosition;
	}
	
	static Difference(pPositionA, pPositionB) {
		return [pPositionA[0] - pPositionB[0], pPositionA[1] - pPositionB[1]];
	} 
	
	static Differencefromxy(pPositionA, pPositionB) {
		return [pPositionA.x - pPositionB.x, pPositionA.y - pPositionB.y];
	}
	
	static Summ(pPositionA, pPositionB) {
		return [pPositionA[0] + pPositionB[0], pPositionA[1] + pPositionB[1]];
	}
	
	static isEqual(pPositionA, pPositionB) {
		return (pPositionA[0] == pPositionB[0] && pPositionA[1] == pPositionB[1]);
	}
	
	static TokenDifference(pTokenA, pTokenB) {
		return GeometricUtils.Difference(GeometricUtils.CenterPosition(pTokenA), GeometricUtils.CenterPosition(pTokenB));
	}
	
	static value(pVector) {
		return Math.sqrt(pVector[0] ** 2 + pVector[1] ** 2);
	}

	static average(pVectors) {
		let vAverage = [];
		
		for (let i = 0; i < pVectors.length; i++) {
			for (let j = 0; j < pVectors[i].length; j++) {
				if (vAverage.length <= j) {
					vAverage[j] = 0;
				}
				
				vAverage[j] = ((i * vAverage[j]) + pVectors[i][j])/(i+1);
			}
		}
		
		return vAverage;
	}
	
	static scale(pNumberArray, pfactor) {
		return pNumberArray.map(pValue => pValue*pfactor);
	} 
	
	static scalexy(pNumberArray, pfactorarray) {
		return [pNumberArray[0] * pfactorarray[0], pNumberArray[1] * pfactorarray[1]];
	} 
	
	static scaleto(pVector, pfactor) {
		return GeometricUtils.scale(pVector, pfactor/GeometricUtils.value(pVector));
	}
	
	static scaletoxy(pVector, pfactorarray) {
		return GeometricUtils.scalexy(GeometricUtils.norm(GeometricUtils.scalexy(pVector, pfactorarray.map(vvalue => 1/vvalue))),pfactorarray);
	} 
	
	static norm(pVector) {
		return GeometricUtils.scaleto(pVector, 1);
	} 
	
	static Direction(pPositionA, pPositionB) {
		let vDifference = GeometrixUtils.Difference(pPositionA, pPositionB);
		
		return GeometrixUtils.scale(vDifference, 1/GeometrixUtils.value(vDifference));
	}
	
	static Distance(pPositionA, pPositionB) {
		return GeometricUtils.value(GeometricUtils.Difference(pPositionA, pPositionB));
	}
	
	static DistanceXY(pPositionA, pPositionB) {
		return Math.sqrt((pPositionA.x - pPositionB.x)**2 + (pPositionA.y - pPositionB.y)**2);
	}
	
	static DistanceXYZ(pPositionA, pPositionB, pElevationScale = 1) {
		return Math.sqrt((pPositionA.x - pPositionB.x)**2 + (pPositionA.y - pPositionB.y)**2 + ((pPositionA.elevation - pPositionB.elevation)*pElevationScale)**2);
	}
	
	static scaledDistance(pPositionA, pPositionB, pfactorarray, protation = 0) {
		if (!protation) {
			return GeometricUtils.value(GeometricUtils.scalexy(GeometricUtils.Difference(pPositionA, pPositionB), pfactorarray));
		}
		else {
			return GeometricUtils.value(GeometricUtils.scalexy(GeometricUtils.Rotated(GeometricUtils.Difference(pPositionA, pPositionB), protation), pfactorarray));
		}
	} 
	
	static TokenDistance(pTokenA, pTokenB) {
		if ((pTokenA) && (pTokenB)) {
			return Math.sqrt( ((pTokenA.x+GeometricUtils.insceneWidth(pTokenA)/2)-(pTokenB.x+GeometricUtils.insceneWidth(pTokenB)/2))**2 + ((pTokenA.y+GeometricUtils.insceneHeight(pTokenA)/2)-(pTokenB.y+GeometricUtils.insceneHeight(pTokenB)/2))**2)/(canvas.scene.dimensions.size)*(canvas.scene.dimensions.distance);
		}
		
		return 0;
	}
	
	static TokenBorderDistance(pTokenA, pTokenB) {
		if ((pTokenA) && (pTokenB)) {
			let vDistance = GeometricUtils.TokenDistance(pTokenA, pTokenB) - (Math.max((GeometricUtils.insceneWidth(pTokenA)+GeometricUtils.insceneWidth(pTokenB)), (GeometricUtils.insceneHeight(pTokenA)+GeometricUtils.insceneHeight(pTokenB)))/2)/(canvas.scene.dimensions.size)*(canvas.scene.dimensions.distance);
			
			if (vDistance < 0) {
				return 0;
			}
			else {
				return vDistance;
			}
		}
		
		return 0;
	}
	
	static insceneWidth(pToken) {
		if (pToken.documentName == "Tile") {
			return pToken.width;
		}
		
		if (pToken.object) {
			return pToken.object.w;
		}
		else {
			return pToken.width * FCore.sceneof(pToken).dimensions.size;
		}
	}
	
	static insceneHeight(pToken) {		
		if (pToken.documentName == "Tile") {
			return pToken.height;
		}
		
		if (pToken.object) {
			return pToken.object.h;
		}
		else {
			return pToken.height * FCore.sceneof(pToken).dimensions.size;
		}
	}
	
	static insceneSize(pToken) {
		return FCore.sceneof(pToken).dimensions.size;
	}
	
	static insceneCenter(pObject) {
		if (pObject.documentName == "Token") {
			let vCenter = {x: pObject.x + GeometricUtils.insceneWidth(pObject)/2, y: pObject.y + GeometricUtils.insceneHeight(pObject)/2};
			
			return vCenter;
		}
		
		if (pObject.documentName == "Wall") {
			let vCenter = {x: (pObject.c[0] + pObject.c[2])/2, y: (pObject.c[1] + pObject.c[3])/2};
			
			return vCenter;			
		}
	}
	
	//sort
	static sortbymaxdim(pTokens) {
		let vsortedTokens = pTokens.sort(function(vTokena,vTokenb){return Math.max(vTokena.height, vTokena.width)-Math.max(vTokenb.height, vTokenb.width)});
		
		let vsortedmaxdim = vsortedTokens.map(vToken => Math.max(vToken.height, vToken.width));
		
		return [vsortedTokens, vsortedmaxdim];
	} 
	
	//advanced
	static closestBorderposition(pToken, pTokenForm, pDirection) {
		//unrotate direction to calculate relative position
		let vDirection = GeometricUtils.Rotated(pDirection, -pToken.rotation);
		
		switch (pTokenForm) {
			case cTokenFormCircle:
				if (Math.max(GeometricUtils.insceneWidth(pToken) == GeometricUtils.insceneHeight(pToken))) {
					return (GeometricUtils.scaleto(vDirection, Math.max(GeometricUtils.insceneWidth(pToken))/2));
				}
				else {				
					//supports ellipses through scaling
					return GeometricUtils.scaletoxy(vDirection, [GeometricUtils.insceneWidth(pToken)/2, GeometricUtils.insceneHeight(pToken)/2]);
				}
				
				break;
			
			case cTokenFormRectangle:
				let vTarget = [0, 0];
				
				//calculate if position is on x or y border (x-Border : Left/Right, y-Border:Top/Bottom
				let vxBorder = (Math.abs(vDirection[0]) / GeometricUtils.insceneWidth(pToken) > Math.abs(vDirection[1]) / GeometricUtils.insceneHeight(pToken));
				
				if (vxBorder) {
					vTarget[0] = Math.sign(vDirection[0]) * GeometricUtils.insceneWidth(pToken)/2;

					vTarget[1] = vDirection[1]/vDirection[0] * vTarget[0];
				}
				else {
					vTarget[1] = Math.sign(vDirection[1]) * GeometricUtils.insceneHeight(pToken)/2;
					
					vTarget[0] = vDirection[0]/vDirection[1] * vTarget[1];
				}
				
				return vTarget;
			
				break;
				
			default:
				return [0,0];
		}
	} 
	
	static withinBoundaries(pToken, pTokenForm, pPosition) {
		
		switch (pTokenForm) {
			case cTokenFormCircle:
				if (Math.max(GeometricUtils.insceneWidth(pToken) == GeometricUtils.insceneHeight(pToken))) {
					return (GeometricUtils.Distance(GeometricUtils.CenterPosition(pToken), pPosition) <= Math.max(GeometricUtils.insceneWidth(pToken))/2);
				}
				else {	
					//supports ellipses through scaling
					return (GeometricUtils.scaledDistance(GeometricUtils.CenterPosition(pToken), pPosition, [1/GeometricUtils.insceneWidth(pToken), 1/GeometricUtils.insceneHeight(pToken)], -pToken.rotation) <= 1/2);
				}
				
				break;
			
			case cTokenFormRectangle:
				let vDifference = GeometricUtils.Difference(GeometricUtils.CenterPosition(pToken), pPosition);
				
				vDifference = GeometricUtils.Rotated(vDifference, -pToken.rotation);
				
				return ((Math.abs(vDifference[0]) <= GeometricUtils.insceneWidth(pToken)/2) && (Math.abs(vDifference[1]) <= GeometricUtils.insceneHeight(pToken)/2));
			
				break;
				
			default:
				return false;
		}
	}
	
	//grids
	static GridSnap(ppositon, pGrid, podd) {
		let vsnapposition = [0,0];
		//podd: depends on refrence point, if corner => podd == false, if middle => podd == true
		switch (pGrid.type) {
			case 0:
				//gridless
				return ppositon;
				break;
			
			case 1:
				//squares
				let voffset = 0;
				
				for (let dim = cxid; dim <= cyid; dim++) {
					if (podd && podd[dim]) {
						voffset = pGrid.size/2;
					}
					
					vsnapposition[dim] = Math.sign(ppositon[dim]) * (Math.round((Math.abs(ppositon[dim])-voffset-1)/pGrid.size) * pGrid.size + voffset);
				}
				
				return vsnapposition;
				break;
			
			case 2:
				/*
				let vgridheight = Math.round(chexfactor*pGrid.size+0.5);
				
				console.log(podd);
				
				let vyoffset = 0;
				if (podd && podd[cyid]) {
					vyoffset = vgridheight/2;
				}	
				
				vsnapposition[cyid] = Math.sign(ppositon[cyid]) * (Math.round((Math.abs(ppositon[cyid])-vyoffset)/(vgridheight)-0.5) * vgridheight + vyoffset);
				
				//Check
				
				let vxoffset = 0;		
				
				if (podd && podd[cxid]) {
					vxoffset = vxoffset + pGrid.size/2;
				}		
				
				if (((podd && podd[cxid]) && (Math.round(vsnapposition[cyid]/vgridheight+0.5)%2)) || (!(podd && podd[cxid]) && !(Math.round(vsnapposition[cyid]/vgridheight+0.5)%2))) {
					vxoffset = vxoffset + pGrid.size/2;
				}	

				console.log((Math.abs(ppositon[cxid])-vxoffset)/pGrid.size);
				console.log(Math.round((Math.abs(ppositon[cxid])-vxoffset)/pGrid.size-0.5));
				console.log(Math.round((Math.abs(ppositon[cxid])-vxoffset)/pGrid.size-0.5) * pGrid.size + vxoffset);
				vsnapposition[cxid] = Math.sign(ppositon[cxid]) * (Math.round((Math.abs(ppositon[cxid])-vxoffset)/pGrid.size-0.5) * pGrid.size + vxoffset);
				console.log(vsnapposition[cxid]);
				
				return vsnapposition;
				*/
			//add cases for grids(later)
			default:
				return vsnapposition;
		}
	}
	
	//areas
	static GetArea(pTokens) {
		let vArea = {left : pTokens[0].x, top : pTokens[0].y, right : pTokens[0].x + GeometricUtils.insceneWidth(pTokens[0]), bottom : pTokens[0].y + GeometricUtils.insceneHeight(pTokens[0])};
		
		for (let i = 1; i < pTokens.length; i++) {
			if (pTokens[i].x < vArea.left) {
				vArea.left = pTokens[i].x;
			}
			
			if (pTokens[i].y < vArea.top) {
				vArea.top = pTokens[i].y;
			}
			
			if ((pTokens[i].x + GeometricUtils.insceneWidth(pTokens[i])) > vArea.right) {
				vArea.right = pTokens[i].x + GeometricUtils.insceneWidth(pTokens[i]);
			}
			
			if ((pTokens[i].y + GeometricUtils.insceneHeight(pTokens[i])) > vArea.bottom) {
				vArea.bottom = pTokens[i].y + GeometricUtils.insceneHeight(pTokens[i]);
			}
		}
		
		return vArea;
	}
	
	static ScaleArea(pArea, pScale) {
		let vxchange = Math.round((pArea.right - pArea.left) * (pScale - 1)/2);
		
		let vychange = Math.round((pArea.bottom - pArea.top) * (pScale - 1)/2);
		
		let vresult = {left : 0, top : 0, right : 0, bottom : 0};
		
		vresult.left = pArea.left - vxchange;
		vresult.right = pArea.right + vxchange;
		
		vresult.top = pArea.top - vychange;
		vresult.bottom = pArea.bottom + vychange;
		
		return vresult;
	}
	
	static AreaWidth(pArea) {
		return pArea.right - pArea.left;
	}
	
	static AreaHeight(pArea) {
		return pArea.bottom - pArea.top;
	}
}

export { GeometricUtils }