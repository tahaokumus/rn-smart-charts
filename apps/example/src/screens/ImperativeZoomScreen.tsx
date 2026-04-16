import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Chart, type ChartOption, type ChartRef } from 'rn-smart-charts';
import { sampleLarge } from '../data/seed';

const option: ChartOption = {
  xAxis: { type: 'time', axisLabel: { color: '#888' } },
  yAxis: { type: 'value', axisLabel: { color: '#888' } },
  series: [
    {
      type: 'area',
      smooth: true,
      data: sampleLarge,
      lineStyle: { color: '#EF4444', width: 2 },
      areaStyle: { color: '#EF4444', opacity: 0.3 },
    },
  ],
};

const MS_HOUR = 60 * 60 * 1000;
const MS_DAY = 24 * MS_HOUR;

export function ImperativeZoomScreen() {
  const ref = useRef<ChartRef>(null);

  const zoomLast = (ms: number) => {
    const last = sampleLarge[sampleLarge.length - 1];
    if (!last) return;
    const end = typeof last.x === 'number' ? last.x : last.x.getTime();
    ref.current?.zoomTo(end - ms, end);
  };

  return (
    <View style={styles.root}>
      <View style={styles.controls}>
        <Pressable style={styles.btn} onPress={() => zoomLast(24 * MS_HOUR)}>
          <Text style={styles.btnText}>24H</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => zoomLast(7 * MS_DAY)}>
          <Text style={styles.btnText}>1W</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => zoomLast(30 * MS_DAY)}>
          <Text style={styles.btnText}>1M</Text>
        </Pressable>
        <Pressable style={styles.btn} onPress={() => ref.current?.resetZoom()}>
          <Text style={styles.btnText}>All</Text>
        </Pressable>
      </View>
      <Chart ref={ref} option={option} style={styles.chart} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', padding: 16 },
  controls: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  btn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#fee', borderRadius: 6 },
  btnText: { color: '#a00', fontSize: 13, fontWeight: '600' },
  chart: { flex: 1, backgroundColor: '#fafafa', borderRadius: 12 },
});
