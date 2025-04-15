export const replacePhoto = async (photoId, imageData) => {
  try {
    console.log(`Replacing photo with ID: ${photoId}`);

    if (!photoId) {
      console.error("No photoId provided to replacePhoto");
      throw new Error("Photo ID is required");
    }

    if (!imageData) {
      console.error("No imageData provided to replacePhoto");
      throw new Error("Image data is required");
    }

    let formData = new FormData();

    // Handle different types of imageData
    if (imageData instanceof Blob) {
      // Direct blob upload
      console.log("Uploading image as Blob");
      formData.append("image", imageData, "image.jpg");
    } else if (typeof imageData === "string") {
      if (imageData.startsWith("data:")) {
        // Base64 data URL
        console.log("Uploading image as base64 data URL");
        formData.append("image", imageData);
      } else {
        // Plain base64 string without data URL prefix
        console.log("Uploading image as plain base64 string");
        formData.append("image", `data:image/jpeg;base64,${imageData}`);
      }
    } else {
      // Unsupported type
      console.error("Unsupported image data type:", typeof imageData);
      throw new Error("Unsupported image data type");
    }

    // Add a cache buster to force the server not to use cached versions
    const cacheBuster = Date.now();
    const url = `${API_BASE_URL}/api/pictures/replace/${photoId}?_=${cacheBuster}`;

    console.log(`Sending replacement request to: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error(
        `Server returned error: ${response.status} ${response.statusText}`
      );
      const errorText = await response.text();
      console.error(`Error details: ${errorText}`);
      throw new Error(
        `Server error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("Replacement successful, server response:", data);

    // Add a cache buster to the response to ensure clients reload the image
    return {
      ...data,
      cacheBuster: cacheBuster,
    };
  } catch (error) {
    console.error("Error replacing photo:", error);
    throw error;
  }
};
