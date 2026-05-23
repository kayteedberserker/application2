import { createContext, useContext, useState, useCallback } from 'react';

const UploadProgressContext = createContext();

export const UploadProgressProvider = ({ children }) => {
    const [uploadProgress, setUploadProgress] = useState({
        isVisible: false,
        currentFile: 0,
        totalFiles: 0,
        fileProgress: 0,
        fileName: '',
        status: 'uploading', // 'uploading', 'processing', 'completed', 'error'
        errorMessage: null,
    });

    const startUpload = useCallback((totalFiles, fileName = '') => {
        setUploadProgress({
            isVisible: true,
            currentFile: 1,
            totalFiles,
            fileProgress: 0,
            fileName,
            status: 'uploading',
            errorMessage: null,
        });
    }, []);

    const updateProgress = useCallback((fileProgress, currentFile = null, fileName = '') => {
        setUploadProgress((prev) => ({
            ...prev,
            fileProgress: Math.min(100, Math.max(0, fileProgress)),
            currentFile: currentFile !== null ? currentFile : prev.currentFile,
            fileName: fileName || prev.fileName,
        }));
    }, []);

    const nextFile = useCallback((fileName = '') => {
        setUploadProgress((prev) => ({
            ...prev,
            currentFile: prev.currentFile + 1,
            fileProgress: 0,
            fileName,
        }));
    }, []);

    const setStatus = useCallback((status, errorMessage = null) => {
        setUploadProgress((prev) => ({
            ...prev,
            status,
            errorMessage,
        }));
    }, []);

    const completeUpload = useCallback(() => {
        setUploadProgress((prev) => ({
            ...prev,
            status: 'completed',
            fileProgress: 100,
        }));

        // Auto hide after 1 second
        setTimeout(() => {
            setUploadProgress({
                isVisible: false,
                currentFile: 0,
                totalFiles: 0,
                fileProgress: 0,
                fileName: '',
                status: 'uploading',
                errorMessage: null,
            });
        }, 1000);
    }, []);

    const hideProgress = useCallback(() => {
        setUploadProgress({
            isVisible: false,
            currentFile: 0,
            totalFiles: 0,
            fileProgress: 0,
            fileName: '',
            status: 'uploading',
            errorMessage: null,
        });
    }, []);

    const value = {
        uploadProgress,
        startUpload,
        updateProgress,
        nextFile,
        setStatus,
        completeUpload,
        hideProgress,
    };

    return (
        <UploadProgressContext.Provider value={value}>
            {children}
        </UploadProgressContext.Provider>
    );
};

export const useUploadProgress = () => {
    const context = useContext(UploadProgressContext);
    if (!context) {
        throw new Error('useUploadProgress must be used within UploadProgressProvider');
    }
    return context;
};
