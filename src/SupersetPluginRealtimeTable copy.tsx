import React, { useEffect, createRef } from 'react';
import { styled } from '@superset-ui/core';
import { SupersetPluginRealtimeTableProps, SupersetPluginRealtimeTableStylesProps } from './types';

const Styles = styled.div<SupersetPluginRealtimeTableStylesProps>`
  /* Keep the container styling, but make it scrollable if content overflows */
  background-color: ${({ theme }) => theme.colors.secondary.light2};
  padding: ${({ theme }) => theme.gridUnit * 4}px;
  border-radius: ${({ theme }) => theme.gridUnit * 2}px;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: auto; /* <-- ADD THIS: Important for when the table is larger than the container */

  h3 {
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.gridUnit * 3}px;
    font-size: ${({ theme, headerFontSize }) => theme.typography.sizes[headerFontSize]}px;
    font-weight: ${({ theme, boldText }) => theme.typography.weights[boldText ? 'bold' : 'normal']};
  }

  /* --> ADD THIS: Styling for our new table */
  table {
    width: 100%;
    border-collapse: collapse; /* Makes borders look clean */
  }

  th, td {
    border: 1px solid ${({ theme }) => theme.colors.grayscale.light2};
    padding: ${({ theme }) => theme.gridUnit * 2}px; /* 8px */
    text-align: left;
  }

  thead th {
    background-color: ${({ theme }) => theme.colors.primary.base};
    color: ${({ theme }) => theme.colors.grayscale.light5}; /* White text */
    position: sticky; /* Makes headers stick to the top when you scroll */
    top: 0;
  }

  tbody tr:nth-of-type(even) {
    background-color: ${({ theme }) => theme.colors.grayscale.light4}; /* Zebra striping */
  }

  /* --> REMOVE THIS: We no longer need styles for the <pre> tag */
  /*
  pre {
    height: ${({ theme, headerFontSize, height }) => (
      height - theme.gridUnit * 12 - theme.typography.sizes[headerFontSize]
    )}px;
  }
  */
`;

function refreshData(setDataMask: SupersetPluginRealtimeTableProps['setDataMask']) {
  setDataMask({
    ownState: {
      refresh: Date.now(),
    },
  });
}

export default function SupersetPluginRealtimeTableComponent(props: SupersetPluginRealtimeTableProps) {
  const { data, height, width, setDataMask } = props;
  const rootElem = createRef<HTMLDivElement>();

  useEffect(() => {
    // This refresh logic is great, let's keep it!
    const id = setInterval(() => {
      refreshData(setDataMask);
    }, props.refreshInterval * 1000);
    return () => clearInterval(id);
  });

  // --> ADD THIS: Logic to handle no data and get table headers
  if (!data || data.length === 0) {
    return (
      <Styles
        height={height}
        width={width}
        headerFontSize={props.headerFontSize}
        boldText={props.boldText}
      >
        <h3>{props.headerText}</h3>
        <p>No data to display.</p>
      </Styles>
    );
  }
  const tableHeaders = Object.keys(data[0]);
  // <-- END ADD

  return (
    <Styles
      ref={rootElem}
      boldText={props.boldText}
      headerFontSize={props.headerFontSize}
      height={height}
      width={width}
    >
      <h3>{props.headerText}</h3>
      {/* --> REPLACE THIS SECTION */}
      {/* <pre>${JSON.stringify(data, null, 2)}</pre> */}

      {/* --> WITH THIS TABLE STRUCTURE */}
      <table>
        <thead>
          <tr>
            {tableHeaders.map(header => (
              <th key={header}>{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {tableHeaders.map(header => (
                <td key={`${rowIndex}-${header}`}>{String(row[header])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {/* <-- END REPLACE */}
    </Styles>
  );
}