import { getDb } from "../api/queries/connection";
import { users, avatars, ratings, socialLinks, reviews, notifications } from "./schema";

async function seed() {
  const db = getDb();

  console.log("Seeding database...");

  // Clear existing data
  await db.delete(notifications);
  await db.delete(reviews);
  await db.delete(ratings);
  await db.delete(socialLinks);
  await db.delete(avatars);
  await db.delete(users);

  // Create mock users/creators
  const creatorData = [
    { name: "NeonVoxel", handle: "neonvoxel", bio: "Creating hyper-realistic cyberpunk AI avatars. Prompt engineer & digital artist. Commissions open!", avatar: "/avatars/avatar-1.jpg", creatorMode: true },
    { name: "SilverWave", handle: "silverwave", bio: "Anime-inspired realistic portraits. Bringing 2D dreams to 3D life.", avatar: "/avatars/avatar-2.jpg", creatorMode: true },
    { name: "EtherealMuse", handle: "etherealmuse", bio: "Fantasy AI artist. Crafting ethereal beings from pure imagination.", avatar: "/avatars/avatar-3.jpg", creatorMode: true },
    { name: "AuraQueen", handle: "auraqueen", bio: "Elegant portrait specialist. Celebrating beauty in all its forms.", avatar: "/avatars/avatar-4.jpg", creatorMode: true },
    { name: "TechNomad", handle: "technomad", bio: "Modern lifestyle avatars. The future of digital identity.", avatar: "/avatars/avatar-5.jpg", creatorMode: true },
    { name: "LumiereArt", handle: "lumiereart", bio: "Painterly photorealism. Where classical art meets AI innovation.", avatar: "/avatars/avatar-6.jpg", creatorMode: true },
    { name: "WilderCraft", handle: "wildercraft", bio: "Adventure aesthetic avatars. For the explorers at heart.", avatar: "/avatars/avatar-7.jpg", creatorMode: true },
    { name: "VogueAI", handle: "vogueai", bio: "High-fashion AI editorial. Runway-ready digital faces.", avatar: "/avatars/avatar-8.jpg", creatorMode: true },
  ];

  interface UserWithId { name: string; handle: string; bio: string; avatar: string; creatorMode: boolean; id: number }
  const createdUsers: UserWithId[] = [];
  for (const c of creatorData) {
    const result = await db.insert(users).values({
      name: c.name,
      handle: c.handle,
      bio: c.bio,
      avatar: c.avatar,
      creatorMode: c.creatorMode,
      role: "user",
      unionId: `mock_${c.handle}`,
    });
    createdUsers.push({ ...c, id: Number(result[0].insertId) });
  }

  console.log(`Created ${createdUsers.length} creators`);

  // Create avatars
  const avatarImages = [
    "/avatars/avatar-1.jpg",
    "/avatars/avatar-2.jpg",
    "/avatars/avatar-3.jpg",
    "/avatars/avatar-4.jpg",
    "/avatars/avatar-5.jpg",
    "/avatars/avatar-6.jpg",
    "/avatars/avatar-7.jpg",
    "/avatars/avatar-8.jpg",
  ];

  const tagOptions = ["Realistic", "Anime", "Cyberpunk", "Fantasy", "Portrait", "3D", "Editorial", "Lifestyle"];
  const captions = [
    "Neon dreams in pixel form ✨",
    "Where anime meets reality",
    "An ethereal being from the golden realm",
    "Confidence is the best accessory",
    "The future is now. Digital identity unlocked.",
    "Painterly perfection with a modern twist",
    "Mountain air and golden hour glow",
    "Runway ready. Always.",
  ];

  const avatarStyles = ["animated", "photorealistic", "animated", "photorealistic", "photorealistic", "photorealistic", "photorealistic", "photorealistic"] as const;

  const createdAvatars = [];
  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    const result = await db.insert(avatars).values({
      creatorId: user.id,
      imageUrl: avatarImages[i],
      caption: captions[i],
      tags: [tagOptions[i % tagOptions.length], tagOptions[(i + 2) % tagOptions.length]],
      isPublic: true,
      isPrimary: true,
      avatarStyle: avatarStyles[i],
    });
    createdAvatars.push({ id: Number(result[0].insertId), creatorId: user.id });
  }

  console.log(`Created ${createdAvatars.length} avatars`);

  // Create ratings (hot/not votes)
  const verdicts = ["hot", "not"] as const;
  const ratingCount = 0;
  for (const avatar of createdAvatars) {
    // Each avatar gets 15-30 random ratings
    const numRatings = 15 + Math.floor(Math.random() * 16);
    for (let r = 0; r < numRatings; r++) {
      // 70% fire, 30% ice
      const verdict = Math.random() < 0.7 ? "fire" : "ice";
      const ratingValue = Math.floor(Math.random() * 10) + 1; // 1-10
      await db.insert(ratings).values({
        avatarId: avatar.id,
        voterId: null, // anonymous ratings for seed
        verdict,
        ratingValue,
      });
    }
  }

  console.log(`Created ratings for all avatars`);

  // Create social links
  const platforms = ["instagram", "tiktok", "twitter", "youtube", "linktree", "website"] as const;
  const platformLabels: Record<string, string> = {
    instagram: "Instagram",
    tiktok: "TikTok",
    twitter: "Twitter/X",
    youtube: "YouTube",
    linktree: "Linktree",
    website: "Website",
  };

  for (let i = 0; i < createdUsers.length; i++) {
    const user = createdUsers[i];
    // Each creator gets 2-4 social links
    const numLinks = 2 + Math.floor(Math.random() * 3);
    const shuffled = [...platforms].sort(() => Math.random() - 0.5);
    for (let s = 0; s < numLinks; s++) {
      const platform = shuffled[s];
      await db.insert(socialLinks).values({
        userId: user.id,
        platform,
        url: `https://${platform}.com/${user.handle}`,
        label: platformLabels[platform],
        sortOrder: s,
      });
    }
  }

  console.log(`Created social links`);

  // Create reviews
  const reviewTexts = [
    "Absolutely stunning detail! The lighting is incredible.",
    "Best AI avatar I've seen this week. Instant follow!",
    "The eyes are so realistic. What prompt did you use?",
    "Love the style! Very unique and creative.",
    "This could be a real photo. Mind blown! 🤯",
    "The color grading is chef's kiss. Perfect aesthetic.",
    "I need this as my profile pic. Amazing work!",
    "So lifelike! The skin texture is next level.",
    "Incredible composition. True artistry.",
    "Rated hot immediately. This is fire! 🔥",
  ];

  const reviewerNames = ["ArtLover42", "PixelFan", "AICritic", "DesignNerd", "CreativeSoul", "TechArtist", "VisualVibe", "DigitalDreamer"];

  for (const avatar of createdAvatars) {
    // Each avatar gets 3-7 reviews
    const numReviews = 3 + Math.floor(Math.random() * 5);
    for (let r = 0; r < numReviews; r++) {
      await db.insert(reviews).values({
        avatarId: avatar.id,
        reviewerId: createdUsers[r % createdUsers.length].id,
        rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
        text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      });
    }
  }

  console.log(`Created reviews`);

  // Create some notifications for the first creator
  const notifMessages = [
    { type: "hot_vote" as const, message: "Someone rated your avatar HOT 🔥" },
    { type: "review" as const, message: "New review: 'Absolutely stunning detail!'" },
    { type: "milestone" as const, message: "You reached 100 hot votes! 🎉" },
    { type: "system" as const, message: "Welcome to AvatarRate! Complete your profile." },
  ];

  for (const notif of notifMessages) {
    await db.insert(notifications).values({
      userId: createdUsers[0].id,
      type: notif.type,
      message: notif.message,
      read: false,
    });
  }

  console.log(`Created notifications`);
  console.log("Seed complete! ✨");
}

seed().catch(console.error);
