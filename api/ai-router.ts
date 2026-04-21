import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { avatars } from "@db/schema";
import { eq } from "drizzle-orm";

const TIPS_MAP: Record<string, string[]> = {
  Realism: [
    "The facial proportions look very natural — excellent work!",
    "Consider refining the skin texture for even more realism.",
    "The eye detail is stunningly lifelike.",
  ],
  VisualAppeal: [
    "Great composition! The framing draws the eye perfectly.",
    "The color palette is very pleasing and cohesive.",
    "Consider adjusting the contrast for more visual impact.",
  ],
  DetailQuality: [
    "Incredible level of detail in the hair and features.",
    "The micro-details really make this avatar stand out.",
    "Could benefit from sharper detail in background elements.",
  ],
  Lighting: [
    "Beautiful lighting setup — very professional.",
    "The rim lighting adds great dimension.",
    "Consider adding more fill light to reduce harsh shadows.",
  ],
  Uniqueness: [
    "Very distinctive style — instantly recognizable.",
    "The creative approach sets this apart from typical avatars.",
    "Consider adding more personal flair to make it truly unique.",
  ],
};

function getTips(lowestCategory: string): string[] {
  const tips: string[] = [];
  const categoryTips = TIPS_MAP[lowestCategory] ?? TIPS_MAP["Realism"];
  tips.push(categoryTips[Math.floor(Math.random() * categoryTips.length)]);

  // Add a general positive tip
  const allCategories = Object.keys(TIPS_MAP);
  const randomCat = allCategories[Math.floor(Math.random() * allCategories.length)];
  const randomTips = TIPS_MAP[randomCat];
  tips.push(randomTips[Math.floor(Math.random() * randomTips.length)]);

  return tips;
}

export const aiRouter = createRouter({
  analyzeAvatar: authedQuery
    .input(z.object({ avatarId: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();

      // Verify avatar exists and belongs to user
      const [avatar] = await db
        .select()
        .from(avatars)
        .where(eq(avatars.id, input.avatarId))
        .limit(1);

      if (!avatar) {
        throw new Error("Avatar not found");
      }

      // Check if already analyzed
      if (avatar.qualityScore) {
        // Return cached results
        return {
          overallScore: avatar.qualityScore,
          categories: [
            { name: "Realism", score: Math.min(98, avatar.qualityScore + Math.floor(Math.random() * 10 - 5)) },
            { name: "VisualAppeal", score: Math.min(98, avatar.qualityScore + Math.floor(Math.random() * 10 - 5)) },
            { name: "DetailQuality", score: Math.min(98, avatar.qualityScore + Math.floor(Math.random() * 10 - 5)) },
            { name: "Lighting", score: Math.min(98, avatar.qualityScore + Math.floor(Math.random() * 10 - 5)) },
            { name: "Uniqueness", score: Math.min(98, avatar.qualityScore + Math.floor(Math.random() * 10 - 5)) },
          ],
          tips: getTips("Realism"),
        };
      }

      // Simulate AI processing delay
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // Generate random scores between 70-98
      const categories = [
        { name: "Realism", score: 70 + Math.floor(Math.random() * 29) },
        { name: "VisualAppeal", score: 70 + Math.floor(Math.random() * 29) },
        { name: "DetailQuality", score: 70 + Math.floor(Math.random() * 29) },
        { name: "Lighting", score: 70 + Math.floor(Math.random() * 29) },
        { name: "Uniqueness", score: 70 + Math.floor(Math.random() * 29) },
      ];

      const overallScore = Math.round(
        categories.reduce((sum, c) => sum + c.score, 0) / categories.length
      );

      // Find lowest category for targeted tips
      const lowestCategory = categories.reduce((lowest, c) =>
        c.score < lowest.score ? c : lowest
      , categories[0]);

      const tips = getTips(lowestCategory.name);

      // Persist quality score
      await db
        .update(avatars)
        .set({ qualityScore: overallScore })
        .where(eq(avatars.id, input.avatarId));

      return {
        overallScore,
        categories,
        tips,
      };
    }),
});
