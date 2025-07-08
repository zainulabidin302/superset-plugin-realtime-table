import { ChartProps } from '@superset-ui/core';
import { SupersetPluginRealtimeTableProps } from './types';

/**
 * This function is the last step in the data pipeline before props are passed to the
 * React component. It's the ideal place to format data, and crucially, to pass
 * the full `queriesData` object through.
 *
 * @param chartProps The raw chart props received from the Superset backend
 * @returns The final props that will be passed to the component
 */
export default function transformProps(
  chartProps: ChartProps,
): SupersetPluginRealtimeTableProps {
  const { 
    width, height, formData, queriesData
  ,
  hooks: {
    setDataMask = () => { /* no-op */ } // Default to a no-op function if not provided
  }
  
  } = chartProps;

  // For debugging, it's helpful to see what this function receives.
  console.log('--- transformProps received chartProps: ---', chartProps);

  // The main `data` prop is a shortcut to the data from the first query.
  // We use optional chaining `?.` to prevent errors if queriesData is empty.
  const data = queriesData[0]?.data || [];

  // We construct the final props object that our React component will receive.
  // The key fix is to include `queriesData: queriesData` here.
  const finalProps: SupersetPluginRealtimeTableProps = {
    width,
    height,
    data,
    formData,
    queriesData,
    headerText: formData.header_text,
    headerFontSize: formData.headerFontSize,
    setDataMask,
    refreshInterval: formData.refreshInterval,
  };

  console.log('--- transformProps is returning these props: ---', finalProps);

  return finalProps;
}