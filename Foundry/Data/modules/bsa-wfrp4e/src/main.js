import { Adaption } from "./Adaption.js";
import { Settings } from "./Settings.js";
Hooks.on("beavers-system-interface.init", async function () {
	beaversSystemInterface.register(new Adaption());
	Settings.init();
});
Hooks.on("beavers-system-interface.ready", async function () {
	import("./SkillTest.js");
});
