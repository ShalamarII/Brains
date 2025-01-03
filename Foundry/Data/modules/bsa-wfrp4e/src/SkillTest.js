import { Settings } from "./Settings.js";
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
		};
	}
}
class SkillTestCustomized {
	constructor() {
		this.data = { skill: "" };
		this.action = async (initiatorData) => {
			const actor = beaversSystemInterface.initiator(initiatorData).actor;
			const roll = await beaversSystemInterface.actorRollSkill(actor, this.data.skill);
			let success = roll.total;
			if (!Settings.get(Settings.ALLOW_CRITICAL)) {
				success = Math.max(-1, Math.min(1, roll.total));
			}
			return {
				success: success > 0 ? success : 0,
				fail: success > 0 ? 0 : -success
			};
		};
		this.render = () => {
			const skill = this.parent._choices[this.data.skill]?.text || "process";
			return `Skill: ${skill}`;
		};
	}
}
beaversSystemInterface.registerTestClass(new SkillTest());
