-- Enable foreign key enforcement
PRAGMA foreign_keys=ON;

-- Fix comments table
CREATE TABLE `__new_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
);
INSERT INTO `__new_comments` SELECT * FROM `comments`;
DROP TABLE `comments`;
ALTER TABLE `__new_comments` RENAME TO `comments`;

-- Fix friends table
CREATE TABLE `__new_friends` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`friend_id` integer NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`friend_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
INSERT INTO `__new_friends` SELECT * FROM `friends`;
DROP TABLE `friends`;
ALTER TABLE `__new_friends` RENAME TO `friends`;

-- Fix likes table
CREATE TABLE `__new_likes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`post_id` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
);
INSERT INTO `__new_likes` SELECT * FROM `likes`;
DROP TABLE `likes`;
ALTER TABLE `__new_likes` RENAME TO `likes`;

-- Fix posts table
CREATE TABLE `__new_posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`content` text NOT NULL,
	`images` text,
	`likes_count` integer DEFAULT 0,
	`comments_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
INSERT INTO `__new_posts` SELECT * FROM `posts`;
DROP TABLE `posts`;
ALTER TABLE `__new_posts` RENAME TO `posts`;

-- Ensure foreign keys are ON again
PRAGMA foreign_keys=ON;
