import { NextResponse } from "next/server";
import { formatSyncDate } from "@/app/components/map/utils";

const FALLBACK_COMMIT = {
  sha: "5f79f7eb046f0419403e1c237a42c1227b9f139a",
  date: "2026-09-07T04:18:26Z",
};

interface GitHubCommitItem {
  sha: string;
  author?: {
    login?: string;
  };
  commit: {
    author?: {
      name?: string;
      email?: string;
      date?: string;
    };
    committer?: {
      name?: string;
      email?: string;
      date?: string;
    };
    message?: string;
  };
}

const isGitHubActionsCommit = (item: GitHubCommitItem): boolean => {
  const authorName = item.commit?.author?.name?.toLowerCase() ?? "";
  const committerName = item.commit?.committer?.name?.toLowerCase() ?? "";
  const authorEmail = item.commit?.author?.email?.toLowerCase() ?? "";
  const login = item.author?.login?.toLowerCase() ?? "";
  const message = item.commit?.message ?? "";

  return (
    authorName.includes("github actions") ||
    committerName.includes("github actions") ||
    authorEmail.includes("actions@github.com") ||
    login.includes("actions") ||
    message.includes("Update penny_machines.json")
  );
};

export async function GET() {
  let commitSha = FALLBACK_COMMIT.sha;
  let rawDate = FALLBACK_COMMIT.date;

  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "pennydex-app",
    };

    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const githubRes = await fetch(
      "https://api.github.com/repos/ysadamt/pennydex/commits?path=data/penny_machines.json&per_page=5",
      {
        headers,
        next: { revalidate: 3600 },
      },
    );

    if (githubRes.ok) {
      const commits: GitHubCommitItem[] = await githubRes.json();
      if (Array.isArray(commits) && commits.length > 0) {
        const targetCommit =
          commits.find(isGitHubActionsCommit) || commits[0];

        const commitDate =
          targetCommit?.commit?.author?.date ||
          targetCommit?.commit?.committer?.date;

        if (commitDate) {
          rawDate = commitDate;
          commitSha = targetCommit.sha;
        }
      }
    } else {
      console.warn(
        `GitHub API returned status ${githubRes.status}, falling back to local git/fallback info`,
      );
      throw new Error(`GitHub API error: ${githubRes.status}`);
    }
  } catch {
    // If GitHub API fails or is rate-limited, try local git log if available
    try {
      const { execSync } = await import("child_process");
      const gitOutput = execSync(
        'git log -n 10 --format="%H|%an|%ae|%aI|%s" -- data/penny_machines.json',
        { encoding: "utf-8" },
      );

      const lines = gitOutput.trim().split("\n");
      for (const line of lines) {
        const [hash, author, email, dateStr, ...rest] = line.split("|");
        const msg = rest.join("|");
        const authorLower = author?.toLowerCase() ?? "";
        if (
          authorLower.includes("github actions") ||
          email?.includes("actions@github.com") ||
          msg?.includes("penny_machines.json")
        ) {
          if (dateStr) {
            rawDate = dateStr;
            commitSha = hash;
            break;
          }
        }
      }
    } catch {
      // Git log unavailable, keep fallback
    }
  }

  const formattedDate = formatSyncDate(rawDate);

  return NextResponse.json(
    {
      date: formattedDate,
      rawDate,
      commitSha,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
