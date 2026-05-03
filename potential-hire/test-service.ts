import { roadmapService } from "./src/lib/services/roadmap.service.js";

async function test() {
  try {
    console.log("Generating roadmap...");
    const roadmap = await roadmapService.generate("user123", "Frontend Developer", 24, []);
    console.log("SUCCESS:", JSON.stringify(roadmap, null, 2));
  } catch (e) {
    console.log("ERROR:", e);
  }
}

test();
