import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { avatarMap } from '@/utils/avatarMap';

type MessageItemProps = {
  item: any;
  isSelected?: boolean;
  onPress?: () => void;
  onSwipeableOpen?: (active: boolean) => void;
  onCollectOrUncollect: (id: string) => Promise<void>; // Right swipe action
  onHide: (id: string) => Promise<void>;               // Left swipe action
  rightLabel: string;                                  // “Collect” or “Uncollect”
};

export default function MessageItem({
  item,
  isSelected,
  onPress,
  onSwipeableOpen,
  onCollectOrUncollect,
  onHide,
  rightLabel,
}: MessageItemProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipe = async (direction: 'left' | 'right') => {
    swipeableRef.current?.close();

    setTimeout(async () => {
      if (direction === 'left') await onHide(item.id);
      if (direction === 'right') await onCollectOrUncollect(item.id);
    }, 150);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={() => (
        <View style={[styles.fullSwipeAction, { backgroundColor: 'black' }]}>
          <Text style={styles.swipeText}>Hide</Text>
        </View>
      )}
      renderRightActions={() => (
        <View style={[styles.fullSwipeAction, { backgroundColor: 'black' }]}>
          <Text style={styles.swipeText}>{rightLabel}</Text>
        </View>
      )}
      onSwipeableWillOpen={() => onSwipeableOpen?.(true)}
      onSwipeableClose={() => onSwipeableOpen?.(false)}
      onSwipeableOpen={(direction) => handleSwipe(direction)}
    >
      <TouchableOpacity onPress={onPress}>
        <View style={[styles.contactRow, isSelected && { backgroundColor: '#d0ebff' }]}>
          <Image
            source={avatarMap[item.owner_profile_picture ?? 'avatar1.jpeg']}
            style={styles.avatar}
          />
          <View style={styles.contactInfo}>
            <Text style={styles.contactName}>{item.owner_username}</Text>
            <Text style={styles.contactEmail}>{item.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  fullSwipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
  swipeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'ShortStack_400Regular',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: 'white',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#ccc',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'ShortStack_400Regular',
  },
  contactEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'ShortStack_400Regular',
  },
});
