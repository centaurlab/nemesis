import { Clock, TeamService } from "./app.js";
const service = new TeamService(new Clock(0));
service.addMember("team", "admin", "admin");
if (!service.invite("team", "admin", "smoke@example.com").token) throw new Error("boot failed");
console.log("BOOT_OK");
