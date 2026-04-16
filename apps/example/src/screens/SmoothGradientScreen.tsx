import { StyleSheet, View } from 'react-native';
import { Chart, type ChartOption } from 'rn-smart-charts';
import { sampleSmall } from '../data/seed';

const option: ChartOption = {
  xAxis: {
    type: 'time',
    axisLabel: { color: '#9AA0A6', fontSize: 12 },
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#9AA0A6', fontSize: 12 },
  },
  series: [
    {
      type: 'area',
      smooth: true,
      data: sampleSmall,
      lineStyle: { color: '#3B82F6', width: 2.5 },
      areaStyle: { color: '#3B82F6', opacity: 0.35 },
    },
  ],
  grid: { left: 36, right: 12, top: 12, bottom: 28 },
};

export function SmoothGradientScreen() {
  return (
    <View style={styles.root}>
      <Chart option={option} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  chart: { width: '100%', height: 280, backgroundColor: '#f7f8fa', borderRadius: 12 },
});
