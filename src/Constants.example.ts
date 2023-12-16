/* eslint-disable unicorn/prefer-math-trunc */
/* eslint-disable sonarjs/no-identical-expressions */
/* !
 *   ██╗  ██╗ █████╗ ███████╗████████╗███████╗██╗
 *   ██║ ██╔╝██╔══██╗██╔════╝╚══██╔══╝██╔════╝██║
 *  █████╔╝ ███████║███████╗   ██║   █████╗  ██║
 *  ██╔═██╗ ██╔══██║╚════██║   ██║   ██╔══╝  ██║
 * ██║  ██╗██║  ██║███████║   ██║   ███████╗███████╗
 * ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚══════╝
 * Copyright(c) 2022-2023 DarkerInk
 * GPL 3.0 Licensed
 */

import process from "node:process";
import { version } from "../package.json";

const Relative = {
	Version: version,
};

const PrivateFlags = {
	Ghost: 1n << 0n,
	System: 1n << 1n,
	Staff: 1n << 2n,
	BetaTester: 1n << 3n,
	Bot: 1n << 4n,
	VerifiedBot: 1n << 5n,
	Spammer: 1n << 6n,
	Tos: 1n << 7n,
	GuildBan: 1n << 8n,
	FriendBan: 1n << 9n,
	GroupchatBan: 1n << 10n,
	WaitingOnAccountDeletion: 1n << 11n,
	WaitingOnDisableDataUpdate: 1n << 12n,
	AccountDeleted: 1n << 13n,
	EmailVerified: 1n << 14n,
	Disabled: 1n << 15n,
	Terminated: 1n << 16n,
	TwoFaEnabled: 1n << 17n,
	TwoFaVerified: 1n << 18n,
	// Temp Increased Values (Testing)
	IncreasedGuildCount100: 1n << 25n,
	IncreasedGuildCount200: 1n << 26n,
	IncreasedGuildCount500: 1n << 27n,
	IncreasedMessageLength2k: 1n << 28n,
	IncreasedMessageLength4k: 1n << 29n,
	IncreasedMessageLength8k: 1n << 30n
}

const Flags = {
	StaffBadge: 1n << 0n,
	GhostBadge: 1n << 1n,
	SponsorBadge: 1n << 2n,
	DeveloperBadge: 1n << 3n,
	VerifiedBotDeveloperBadge: 1n << 4n,
	OriginalUserBadge: 1n << 5n,
	PartnerBadge: 1n << 6n,
	ModeratorBadge: 1n << 7n,
	MinorBugHunterBadge: 1n << 8n,
	IntermediateBugHunterBadge: 1n << 9n,
	MajorBugHunterBadge: 1n << 10n,
	Ghost: 1n << 25n,
	System: 1n << 26n,
	Staff: 1n << 27n,
	BetaTester: 1n << 28n,
	Bot: 1n << 29n,
	VerifiedBot: 1n << 30n,
	Spammer: 1n << 31n,
	Tos: 1n << 32n,
	GuildBan: 1n << 33n,
	FriendBan: 1n << 34n,
	GroupchatBan: 1n << 35n,
	WaitingOnAccountDeletion: 1n << 36n,
	WaitingOnDisableDataUpdate: 1n << 37n,
	AccountDeleted: 1n << 38n,
	EmailVerified: 1n << 39n,
	Disabled: 1n << 40n,
	Terminated: 1n << 41n,
	TwoFaEnabled: 1n << 42n,
	TwoFaVerified: 1n << 43n,
	// Temp Increased Values (Testing)
	IncreasedGuildCount100: 1n << 80n,
	IncreasedGuildCount200: 1n << 81n,
	IncreasedGuildCount500: 1n << 82n,
	IncreasedMessageLength2k: 1n << 83n,
	IncreasedMessageLength4k: 1n << 84n,
	IncreasedMessageLength8k: 1n << 85n
};

const PublicFlags: (keyof typeof Flags)[] = [
	"StaffBadge",
	"GhostBadge",
	"SponsorBadge",
	"DeveloperBadge",
	"VerifiedBotDeveloperBadge",
	"OriginalUserBadge",
	"PartnerBadge",
	"ModeratorBadge",
	"MinorBugHunterBadge",
	"IntermediateBugHunterBadge",
	"MajorBugHunterBadge",
	"VerifiedBot",
	"Spammer"
];


const Snowflake = {
	Epoch: 1_641_016_800_000n,
	SequenceBytes: 6,
	WorkerIdBytes: 12,
	ProcessIdBytes: 1,
	WorkerId: 5,
	ProcessId: process.pid
};

export default {
	Relative,
	Snowflake,
	PrivateFlags,
	Flags,
	PublicFlags
};

export {
	Relative,
	Snowflake,
	PrivateFlags,
	Flags,
	PublicFlags
};
