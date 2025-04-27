// scripts/fetch-lfs-pdfs.mjs
import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch'; // Use node-fetch
import { pipeline } from 'stream/promises'; // For reliable stream piping

// --- Configuration ---
const projectRoot = process.cwd();
const COVERS_DIRECTORY = path.join(projectRoot, 'public/covers');
const OUTPUT_BOOKS_DIRECTORY = path.join(projectRoot, 'public/books'); // Where to save downloaded PDFs
const REPO_OWNER = 'peatysharing'; // Replace with your GitHub username or org
const REPO_NAME = 'bibliography'; // Replace with your repository name
const LFS_POINTER_BASE_PATH = 'public/books'; // The path *within your repository* where the PDF LFS pointers are stored
const GITHUB_TOKEN_ENV_VAR = 'GITHUB_PAT'; // Name of the Vercel Environment Variable for your PAT
// --- End Configuration ---

const GITHUB_TOKEN = process.env[GITHUB_TOKEN_ENV_VAR];
const API_BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

// Helper function to download a file
async function downloadFile(url, outputPath, headers = {}) {
  console.log(`[LFS Fetch] Attempting to download from ${url} to ${outputPath}`);
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status} ${response.statusText} from ${url}`);
    }
    if (!response.body) {
        throw new Error(`Response body is null for ${url}`);
    }
    // Ensure the directory exists before writing
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    // Use pipeline for robust streaming
    await pipeline(response.body, fs.createWriteStream(outputPath));
    console.log(`[LFS Fetch] Successfully downloaded and saved to ${outputPath}`);
    return true;
  } catch (error) {
    console.error(`[LFS Fetch] Error downloading ${url}:`, error);
    // Attempt to clean up potentially incomplete file
    try {
        await fs.unlink(outputPath);
    } catch (cleanupError) {
        // Ignore cleanup error if file didn't exist
        if (cleanupError.code !== 'ENOENT') {
            console.error(`[LFS Fetch] Error cleaning up partial file ${outputPath}:`, cleanupError);
        }
    }
    return false;
  }
}

// Main function to fetch LFS files
async function fetchLfsPdfs() {
  console.log('[LFS Fetch] Starting LFS PDF download process...');

  if (!GITHUB_TOKEN) {
    console.error(`[LFS Fetch] Error: GitHub Personal Access Token not found in environment variable ${GITHUB_TOKEN_ENV_VAR}.`);
    console.error('[LFS Fetch] Please set this variable in your Vercel deployment settings.');
    process.exit(1); // Exit build with error
  }

  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github.v3+json', // Standard API accept header
  };

  // Ensure the output directory exists locally
  try {
    await fs.mkdir(OUTPUT_BOOKS_DIRECTORY, { recursive: true });
    console.log(`[LFS Fetch] Ensured output directory exists: ${OUTPUT_BOOKS_DIRECTORY}`);
  } catch (error) {
    console.error(`[LFS Fetch] Failed to create output directory ${OUTPUT_BOOKS_DIRECTORY}:`, error);
    process.exit(1);
  }

  let coverFilenames;
  try {
    coverFilenames = await fs.readdir(COVERS_DIRECTORY);
    console.log(`[LFS Fetch] Found ${coverFilenames.length} items in ${COVERS_DIRECTORY}`);
  } catch (error) {
    console.error(`[LFS Fetch] Error reading covers directory (${COVERS_DIRECTORY}):`, error);
    if (error.code === 'ENOENT') {
       console.warn(`[LFS Fetch] Covers directory not found. No PDFs will be fetched.`);
       return; // Nothing to do if covers dir doesn't exist
    }
    process.exit(1); // Exit for other errors
  }

  const possibleCoverExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  let successCount = 0;
  let failCount = 0;
  let skippedCount = 0;

  for (const coverFilename of coverFilenames) {
    const extension = path.extname(coverFilename);
    if (!possibleCoverExtensions.some(ext => coverFilename.toLowerCase().endsWith(ext))) {
        // console.log(`[LFS Fetch] Skipping non-cover file: ${coverFilename}`);
        continue; // Skip non-image files silently
    }

    const baseName = coverFilename.replace(new RegExp(`\${extension}$`, 'i'), '');
    const pdfFilename = `${baseName}.pdf`;
    const repoFilePath = `${LFS_POINTER_BASE_PATH}/${pdfFilename}`.replace(/^\/+/, ''); // Path in repo, remove leading slash if any
    const localOutputPath = path.join(OUTPUT_BOOKS_DIRECTORY, pdfFilename);

    // Check if PDF already exists locally (e.g., from a previous partial build)
    try {
        await fs.access(localOutputPath);
        // console.log(`[LFS Fetch] PDF already exists locally, skipping download: ${pdfFilename}`);
        skippedCount++;
        successCount++; // Count existing as success for overall status
        continue;
    } catch (e) {
        // File doesn't exist, proceed to download
    }

    const apiUrl = `${API_BASE_URL}/contents/${encodeURI(repoFilePath)}`; // URL encode the path

    console.log(`[LFS Fetch] Processing cover: ${coverFilename} -> PDF: ${pdfFilename}`);
    console.log(`[LFS Fetch] Fetching metadata from API: ${apiUrl}`);

    try {
      const response = await fetch(apiUrl, { headers });
      const data = await response.json();

      if (!response.ok) {
          if (response.status === 404) {
              console.warn(`[LFS Fetch] ⚠️ PDF pointer not found in repository for ${pdfFilename} (API: ${apiUrl}). Skipping.`);
              failCount++;
              continue;
          }
          throw new Error(`GitHub API error ${response.status}: ${data.message || response.statusText} for ${apiUrl}`);
      }

      if (!data.download_url) {
        console.warn(`[LFS Fetch] ⚠️ No download_url found in API response for ${pdfFilename}. Is it an LFS file? Skipping.`);
        console.warn(`[LFS Fetch] API Response: ${JSON.stringify(data).substring(0, 200)}...`); // Log part of the response
        failCount++;
        continue;
      }

      // Attempt to download the file using the download_url
      // Pass auth header as downloads from private repos might require it
      const downloadSuccess = await downloadFile(data.download_url, localOutputPath, { Authorization: `token ${GITHUB_TOKEN}` });
      if (downloadSuccess) {
        successCount++;
      } else {
        failCount++;
      }

    } catch (error) {
      console.error(`[LFS Fetch] Failed to process ${pdfFilename}:`, error);
      failCount++;
    }
  } // End loop

  console.log('[LFS Fetch] --- Download Summary ---');
  console.log(`[LFS Fetch] Successfully processed/found: ${successCount}`);
  console.log(`[LFS Fetch] Skipped (already existed): ${skippedCount}`);
  console.log(`[LFS Fetch] Failed/Not Found: ${failCount}`);
  console.log('[LFS Fetch] LFS PDF download process finished.');

  if (failCount > 0) {
      console.warn(`[LFS Fetch] ${failCount} PDF(s) failed to download or were not found. Check logs above.`);
      // Decide if build should fail on errors. For now, let it continue.
      // process.exit(1);
  }
}

// Execute the function
fetchLfsPdfs().catch(err => {
    console.error("[LFS Fetch] Unhandled error during LFS fetch:", err);
    process.exit(1);
});
