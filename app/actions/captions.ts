"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const API_BASE_URL = "https://api.almostcrackd.ai";

// Step 1: Generate presigned URL for upload
async function generatePresignedUrl(
  token: string,
  contentType: string
): Promise<{ presignedUrl: string; cdnUrl: string }> {
  const response = await fetch(`${API_BASE_URL}/pipeline/generate-presigned-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ contentType }),
  });

  if (!response.ok) {
    throw new Error(`Failed to generate presigned URL: ${response.statusText}`);
  }

  return response.json();
}

// Step 2: Upload image bytes to presigned URL
async function uploadImageToPresignedUrl(
  presignedUrl: string,
  fileBuffer: Buffer,
  contentType: string
): Promise<void> {
  const response = await fetch(presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: fileBuffer as any,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload image: ${response.statusText}`);
  }
}

// Step 3: Register image URL in the pipeline
async function registerImageInPipeline(
  token: string,
  cdnUrl: string
): Promise<{ imageId: string; now: number }> {
  const response = await fetch(`${API_BASE_URL}/pipeline/upload-image-from-url`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      imageUrl: cdnUrl,
      isCommonUse: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Response (${response.status}):`, errorText);
    throw new Error(`Failed to register image: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Step 4: Generate captions
async function generateCaptions(
  token: string,
  imageId: string
): Promise<any[]> {
  const response = await fetch(`${API_BASE_URL}/pipeline/generate-captions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageId }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error Response (${response.status}):`, errorText);
    throw new Error(`Failed to generate captions: ${response.status} ${response.statusText} - ${errorText}`);
  }

  try {
    return await response.json();
  } catch (parseError) {
    const responseText = await response.text();
    console.error("Failed to parse captions response:", responseText);
    throw new Error(`Invalid response format from captions API: ${responseText}`);
  }
}

// Main function: orchestrate all 4 steps
export async function uploadImageAndGenerateCaptions(
  base64FileString: string,
  contentType: string
) {
  try {
    // Get the server-side Supabase client with cookies
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookiesToSet: any[]) => {
            cookiesToSet.forEach(({ name, value, options }: any) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get the authenticated user and session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "You must be logged in to upload images",
      };
    }

    // Get the session to extract JWT token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {
        success: false,
        error: "Failed to get authentication token",
      };
    }

    const token = session.access_token;

    // Convert base64 string back to Buffer
    const fileBuffer = Buffer.from(base64FileString, "base64");

    // Step 1: Generate presigned URL
    const { presignedUrl, cdnUrl } = await generatePresignedUrl(
      token,
      contentType
    );

    // Step 2: Upload image to presigned URL
    await uploadImageToPresignedUrl(presignedUrl, fileBuffer, contentType);

    // Step 3: Register image in pipeline
    const { imageId } = await registerImageInPipeline(token, cdnUrl);

    // Step 4: Generate captions
    const captions = await generateCaptions(token, imageId);

    return {
      success: true,
      captions,
      imageId,
      cdnUrl,
    };
  } catch (error) {
    console.error("Error in caption pipeline:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process image",
    };
  }
}
