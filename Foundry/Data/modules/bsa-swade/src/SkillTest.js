class SkillTest {
	constructor() {
		this.type = "SkillTest";
		this._choices = {};
		this.informationField = {
			name: "type",
			type: "info",
			label: game['i18n'].localize("beaversSystemInterface.tests.skillTest.info.label"),
			note: game['i18n'].localize("beaversSystemInterface.tests.skillTest.info.note")
		};
		this._choices = beaversSystemInterface.configSkills.reduce((object, skill) => {
			object[skill.id] = { text: skill.label };
			return object;
		}, {});
	}
	create(data) {
		const result = new SkillTestCustomized();
		result.data = data;
		result.parent = this;
		return result;
	}
	get customizationFields() {
		return {
			skill: {
				name: "skill",
				label: "skill",
				note: "Skill",
				type: "selection",
				choices: this._choices
			},
			dc: {
				name: "dc",
				label: "dc",
				note: "Difficulty Class ",
				defaultValue: 4,
				type: "number",
			}
		};
	}
}
class SkillTestCustomized {
	constructor() {
		this.data = { dc: 4, skill: "" };
		this.action = async (initiatorData) => {
			const actor = beaversSystemInterface.initiator(initiatorData).actor;
			const roll = await beaversSystemInterface.actorRollSkill(actor, this.data.skill);
			let dc = this.data.dc;
			if (this.data.dc <= 0) {
				dc = 1;
			}
			const success = Math.floor(roll.total / dc);
			return {
				success: success,
				fail: success > 0 ? 0 : 1
			};
		};
		this.render = () => {
			const skill = this.parent._choices[this.data.skill]?.text || "process";
			return `${skill}:dc ${this.data.dc}`;
		};
	}
}
beaversSystemInterface.registerTestClass(new SkillTest());
