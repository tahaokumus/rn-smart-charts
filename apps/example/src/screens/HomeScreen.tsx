import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const items: { title: string; subtitle: string; route: keyof RootStackParamList }[] = [
  { title: 'Basic Area', subtitle: 'Linear segments + pan/pinch baseline', route: 'BasicArea' },
  {
    title: 'Smooth Gradient',
    subtitle: 'Matches the reference screenshots',
    route: 'SmoothGradient',
  },
  { title: 'Live Updating', subtitle: 'Streaming data + path morphing', route: 'LiveUpdating' },
  {
    title: 'Imperative Zoom',
    subtitle: 'chartRef.zoomTo / resetZoom buttons',
    route: 'ImperativeZoom',
  },
  {
    title: 'Custom Tooltip',
    subtitle: 'Custom formatters for tooltip + axis',
    route: 'CustomTooltip',
  },
];

export function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      {items.map((it) => (
        <Pressable
          key={it.route}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          onPress={() => navigation.navigate(it.route as never)}
        >
          <Text style={styles.title}>{it.title}</Text>
          <Text style={styles.subtitle}>{it.subtitle}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fafafa' },
  row: { padding: 16, borderBottomColor: '#eee', borderBottomWidth: 1 },
  rowPressed: { backgroundColor: '#f0f0f0' },
  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#888' },
});
