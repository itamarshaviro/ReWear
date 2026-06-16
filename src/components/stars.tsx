import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  score: number;
  interactive?: boolean;
  onPress?: (score: number) => void;
  size?: number;
};

export function Stars({ score, interactive = false, onPress, size = 22 }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(i => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress?.(i)}
          disabled={!interactive}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
        >
          <Text style={[styles.star, { fontSize: size }, i <= score ? styles.filled : styles.empty]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row-reverse', gap: 2 },
  star: { fontWeight: '400' },
  filled: { color: '#F59E0B' },
  empty: { color: '#E5E7EB' },
});
