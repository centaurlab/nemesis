import { Clock, TeamService } from "../src/app.js";
export const setup = () => {
  const clock = new Clock(Date.UTC(2025, 0, 1));
  const service = new TeamService(clock);
  service.addMember("team-1", "admin-1", "admin");
  service.addMember("team-1", "member-1", "member");
  return { clock, service };
};
