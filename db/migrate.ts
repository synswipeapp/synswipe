
import { getDb } from "../api/queries/connection";

async function migrate() {
  const db = getDb();

  // Drop tables that need schema changes
  await db.execute("DROP TABLE IF EXISTS ratings");
  await db.execute("DROP TABLE IF EXISTS password_resets");
  await db.execute("DROP TABLE IF EXISTS subscriptions");
  await db.execute("DROP TABLE IF EXISTS user_preferences");

  // Recreate ratings with new fire/ice enum
  await db.execute(`
    CREATE TABLE ratings (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      avatar_id BIGINT UNSIGNED NOT NULL,
      voter_id BIGINT UNSIGNED,
      verdict ENUM('fire', 'ice') NOT NULL,
      rating_value INT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      UNIQUE INDEX idx_ratings_unique (avatar_id, voter_id),
      INDEX idx_ratings_avatar_verdict (avatar_id, verdict)
    )
  `);

  // Create password_resets
  await db.execute(`
    CREATE TABLE password_resets (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      token VARCHAR(255) NOT NULL UNIQUE,
      expires_at TIMESTAMP NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  // Create subscriptions
  await db.execute(`
    CREATE TABLE subscriptions (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL UNIQUE,
      status ENUM('active', 'cancelled', 'expired') DEFAULT 'active' NOT NULL,
      plan VARCHAR(50) DEFAULT 'creator_monthly' NOT NULL,
      price VARCHAR(20) DEFAULT '6.99' NOT NULL,
      started_at TIMESTAMP DEFAULT NOW() NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      INDEX idx_subscriptions_user (user_id),
      INDEX idx_subscriptions_status (status)
    )
  `);

  // Create user_preferences
  await db.execute(`
    CREATE TABLE user_preferences (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL UNIQUE,
      preferred_style ENUM('photorealistic', 'animated', 'all') DEFAULT 'all' NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL ON UPDATE NOW()
    )
  `);

  console.log("Migration complete!");
}

migrate().catch(console.error);
