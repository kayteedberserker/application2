import React from 'react';
import {
    Modal,
    View,
    ActivityIndicator,
    useColorScheme,
    StyleSheet,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { Text } from './Text';
import THEME from './useAppTheme';

const ProgressModal = ({ visible, progress, onDismiss }) => {
    const isDark = useColorScheme() === 'dark';
    const scaleValue = useSharedValue(0.9);

    React.useEffect(() => {
        if (visible) {
            scaleValue.value = withTiming(1, { duration: 300 });
        } else {
            scaleValue.value = withTiming(0.9, { duration: 300 });
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scaleValue.value }],
    }));

    const getStatusColor = () => {
        switch (progress.status) {
            case 'completed':
                return '#10B981';
            case 'error':
                return '#EF4444';
            case 'processing':
                return '#F59E0B';
            default:
                return THEME.colors.primary;
        }
    };

    const getStatusText = () => {
        switch (progress.status) {
            case 'completed':
                return 'Upload Complete ✓';
            case 'error':
                return `Error: ${progress.errorMessage || 'Upload failed'}`;
            case 'processing':
                return 'Processing...';
            default:
                return 'Uploading...';
        }
    };

    const progressPercentage = Math.round(progress.fileProgress);
    const overallProgress = progress.totalFiles > 0
        ? ((progress.currentFile - 1 + progressPercentage / 100) / progress.totalFiles) * 100
        : progressPercentage;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <View style={[styles.container, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)' }]}>
                <Animated.View style={[styles.modal, animatedStyle, { backgroundColor: isDark ? '#1f2937' : '#ffffff' }]}>
                    {/* Header */}
                    <Text style={styles.title}>Upload Progress</Text>

                    {/* File Counter */}
                    {progress.totalFiles > 1 && (
                        <Text style={[styles.fileCounter, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            File {progress.currentFile} of {progress.totalFiles}
                        </Text>
                    )}

                    {/* File Name */}
                    {progress.fileName && (
                        <Text style={[styles.fileName, { color: isDark ? '#d1d5db' : '#374151' }]} numberOfLines={1}>
                            {progress.fileName}
                        </Text>
                    )}

                    {/* Progress Bar Container */}
                    <View style={[styles.progressBarContainer, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: `${overallProgress}%`,
                                    backgroundColor: getStatusColor(),
                                },
                            ]}
                        />
                    </View>

                    {/* Percentage Text */}
                    <View style={styles.percentageContainer}>
                        <Text style={[styles.percentageText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {progressPercentage}%
                        </Text>
                    </View>

                    {/* Status Text and Spinner */}
                    <View style={styles.statusContainer}>
                        {progress.status !== 'completed' && progress.status !== 'error' && (
                            <ActivityIndicator
                                size="small"
                                color={getStatusColor()}
                                style={styles.spinner}
                            />
                        )}
                        <Text style={[styles.statusText, { color: getStatusColor() }]}>
                            {getStatusText()}
                        </Text>
                    </View>

                    {/* Tip Text */}
                    {progress.status === 'uploading' && (
                        <Text style={[styles.tipText, { color: isDark ? '#6b7280' : '#9ca3af' }]}>
                            Please don't close the app
                        </Text>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '80%',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    fileCounter: {
        fontSize: 12,
        marginBottom: 8,
    },
    fileName: {
        fontSize: 13,
        marginBottom: 16,
        maxWidth: '100%',
    },
    progressBarContainer: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 12,
    },
    progressBar: {
        height: '100%',
        borderRadius: 4,
    },
    percentageContainer: {
        marginBottom: 16,
    },
    percentageText: {
        fontSize: 24,
        fontWeight: '700',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    spinner: {
        marginRight: 8,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tipText: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
    },
});

export default ProgressModal;
