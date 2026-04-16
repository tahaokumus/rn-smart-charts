import { StyleSheet, Text, View } from 'react-native';
import { Chart, type ChartOption } from 'rn-smart-charts';
import { sampleSmall } from '../data/seed';

const MONTHS_TR = [
  'Oca',
  'Şub',
  'Mar',
  'Nis',
  'May',
  'Haz',
  'Tem',
  'Ağu',
  'Eyl',
  'Eki',
  'Kas',
  'Ara',
];

const option: ChartOption = {
  xAxis: {
    type: 'time',
    axisLabel: {
      color: '#9AA0A6',
      formatter: (val) => MONTHS_TR[new Date(val).getMonth()] ?? '',
    },
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#9AA0A6',
      formatter: (val) => `${val.toFixed(0)} kg`,
    },
  },
  series: [
    {
      type: 'area',
      smooth: true,
      data: sampleSmall,
      lineStyle: { color: '#EF4444', width: 2.5 },
      areaStyle: { color: '#EF4444', opacity: 0.3 },
    },
  ],
  tooltip: {
    formatter: ({ x, y }) => {
      const d = new Date(x);
      return `${y.toFixed(2)} kg @ ${MONTHS_TR[d.getMonth()] ?? ''} ${d.getDate()}`;
    },
    textStyle: { color: '#fff', backgroundColor: 'rgba(20,20,20,0.85)' },
  },
};

export function CustomTooltipScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.hint}>
        Long-press the chart to see the custom tooltip. Drag to scrub.
      </Text>
      <Chart option={option} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  hint: { color: '#666', fontSize: 13, marginBottom: 8 },
  chart: { width: '100%', height: 280, backgroundColor: '#f7f8fa', borderRadius: 12 },
});
