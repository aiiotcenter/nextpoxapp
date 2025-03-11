import { useState } from "react";

const useFileUpload = () => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const uploadFile = async (file: File | null) => {
        if (!file) {
            setUploadError("File not selected");
            return null;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", file);

            const uploadResponse = await fetch(`/api/upload`, {
                method: "POST",
                body: uploadFormData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload the file");
            }

            const uploadResult = await uploadResponse.json();
            return uploadResult.filePath || ""; // Adjust based on your API response structure
        } catch (error) {
            setUploadError("Error uploading file");
            console.error("Upload Error:", error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    return { uploadFile, isUploading, uploadError };
};

export default useFileUpload;
