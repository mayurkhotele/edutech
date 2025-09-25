import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChannelProfileType, ClientRoleType, RtcEngine } from 'react-native-agora';

interface AgoraVoiceChatProps {
  appId: string;
  channelName: string;
  uid: number;
  isMyTurn: boolean;
  currentTurn: number;
  onError?: (error: string) => void;
  onJoinSuccess?: () => void;
  onLeaveChannel?: () => void;
}

const AgoraVoiceChat: React.FC<AgoraVoiceChatProps> = ({
  appId,
  channelName,
  uid,
  isMyTurn,
  currentTurn,
  onError,
  onJoinSuccess,
  onLeaveChannel,
}) => {
  const [isJoined, setIsJoined] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<RtcEngine | null>(null);

  useEffect(() => {
    initializeAgora();
    return () => {
      leaveChannel();
    };
  }, []);

  // Auto-mute when not your turn
  useEffect(() => {
    if (isJoined && engineRef.current) {
      if (!isMyTurn) {
        engineRef.current.muteLocalAudioStream(true);
        setIsMuted(true);
        console.log('🎤 Auto-muted (not your turn)');
      }
    }
  }, [isMyTurn, isJoined]);

  const initializeAgora = async () => {
    try {
      console.log('🎤 Initializing Agora...');
      
      // Create RtcEngine instance
      const engine = await RtcEngine.create(appId);
      engineRef.current = engine;

      // Set channel profile to communication
      await engine.setChannelProfile(ChannelProfileType.ChannelProfileCommunication);

      // Set client role to broadcaster
      await engine.setClientRole(ClientRoleType.ClientRoleBroadcaster);

      // Enable audio
      await engine.enableAudio();

      // Set audio profile
      await engine.setAudioProfile(1, 1); // High quality audio

      // Join channel
      await joinChannel();

    } catch (error) {
      console.error('🎤 Failed to initialize Agora:', error);
      const errorMessage = `Failed to initialize Agora: ${error}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const joinChannel = async () => {
    try {
      if (!engineRef.current) return;

      console.log('🎤 Joining channel:', channelName);
      
      await engineRef.current.joinChannel(null, channelName, null, uid);
      setIsJoined(true);
      setIsMuted(true); // Start muted
      
      console.log('🎤 Successfully joined channel');
      onJoinSuccess?.();

    } catch (error) {
      console.error('🎤 Failed to join channel:', error);
      const errorMessage = `Failed to join channel: ${error}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const leaveChannel = async () => {
    try {
      if (engineRef.current && isJoined) {
        console.log('🎤 Leaving channel...');
        
        await engineRef.current.leaveChannel();
        await engineRef.current.destroy();
        engineRef.current = null;
        
        setIsJoined(false);
        setIsMuted(true);
        
        console.log('🎤 Left channel successfully');
        onLeaveChannel?.();
      }
    } catch (error) {
      console.error('🎤 Failed to leave channel:', error);
    }
  };

  const toggleMicrophone = async () => {
    if (!engineRef.current || !isJoined) return;

    try {
      if (isMuted) {
        // Unmute
        await engineRef.current.muteLocalAudioStream(false);
        setIsMuted(false);
        console.log('🎤 Microphone unmuted');
      } else {
        // Mute
        await engineRef.current.muteLocalAudioStream(true);
        setIsMuted(true);
        console.log('🎤 Microphone muted');
      }
    } catch (error) {
      console.error('🎤 Failed to toggle microphone:', error);
      const errorMessage = `Failed to toggle microphone: ${error}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  const toggleSpeaker = async () => {
    if (!engineRef.current || !isJoined) return;

    try {
      if (isSpeakerEnabled) {
        // Disable speaker
        await engineRef.current.setEnableSpeakerphone(false);
        setIsSpeakerEnabled(false);
        console.log('🎤 Speaker disabled (using earpiece)');
      } else {
        // Enable speaker
        await engineRef.current.setEnableSpeakerphone(true);
        setIsSpeakerEnabled(true);
        console.log('🎤 Speaker enabled');
      }
    } catch (error) {
      console.error('🎤 Failed to toggle speaker:', error);
      const errorMessage = `Failed to toggle speaker: ${error}`;
      setError(errorMessage);
      onError?.(errorMessage);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeAgora}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          {isJoined ? '🎤 Connected' : '🎤 Connecting...'}
        </Text>
        {isMyTurn && (
          <Text style={styles.turnText}>Your Turn - Speak Now!</Text>
        )}
      </View>

      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.micButton,
            isMuted ? styles.mutedButton : styles.unmutedButton,
            !isMyTurn && styles.disabledButton
          ]}
          onPress={toggleMicrophone}
          disabled={!isJoined || !isMyTurn}
        >
          <Text style={styles.controlButtonText}>
            {isMuted ? '🎤' : '🔇'}
          </Text>
          <Text style={styles.controlButtonLabel}>
            {isMuted ? 'Unmute' : 'Mute'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.speakerButton,
            isSpeakerEnabled ? styles.speakerEnabled : styles.speakerDisabled
          ]}
          onPress={toggleSpeaker}
          disabled={!isJoined}
        >
          <Text style={styles.controlButtonText}>
            {isSpeakerEnabled ? '🔊' : '🔉'}
          </Text>
          <Text style={styles.controlButtonLabel}>
            {isSpeakerEnabled ? 'Speaker' : 'Earpiece'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>Channel: {channelName}</Text>
        <Text style={styles.infoText}>UID: {uid}</Text>
        <Text style={styles.infoText}>
          Turn: Player {currentTurn} {isMyTurn ? '(You)' : ''}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    margin: 8,
  },
  errorContainer: {
    backgroundColor: '#ff4444',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ff4444',
    fontWeight: 'bold',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  turnText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  controlButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  micButton: {
    backgroundColor: '#333',
  },
  speakerButton: {
    backgroundColor: '#333',
  },
  mutedButton: {
    backgroundColor: '#ff4444',
  },
  unmutedButton: {
    backgroundColor: '#4CAF50',
  },
  speakerEnabled: {
    backgroundColor: '#2196F3',
  },
  speakerDisabled: {
    backgroundColor: '#666',
  },
  disabledButton: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  controlButtonLabel: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    alignItems: 'center',
  },
  infoText: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 2,
  },
});

export default AgoraVoiceChat;
