import { StyleSheet, Text, View } from 'react-native';
import { Chart, type ChartOption } from 'rn-smart-charts';
import { sampleSmall } from '../data/seed';

const option: ChartOption = {
  xAxis: { type: 'time' },
  yAxis: { type: 'value' },
  series: [
    {
      type: 'area',
      smooth: false,
      data: sampleSmall,
    },
  ],
};

export function BasicAreaScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.label}>Pan with one finger. Pinch to zoom (right edge anchored).</Text>
      <Chart option={option} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  label: { color: '#666', fontSize: 13, marginBottom: 8 },
  chart: { width: '100%', height: 280, backgroundColor: '#fafafa', borderRadius: 12 },
});
