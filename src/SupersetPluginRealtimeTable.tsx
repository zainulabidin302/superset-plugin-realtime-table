import React, { useEffect, useState, useCallback } from 'react';
import { styled } from '@superset-ui/core';
import {
  SupersetPluginRealtimeTableProps,
  SupersetPluginRealtimeTableStylesProps,
} from './types';

//
// --> THIS IS THE FIX: The CSS is updated to be flexible <--
//
const Styles = styled.div<SupersetPluginRealtimeTableStylesProps>`
  /* Let the container take up all the available space provided by Superset */
  height: ${({ height }) => (typeof height === 'string' ? height : `${height}px`)};
  width: ${({ width }) => (typeof width === 'string' ? width : `${width}px`)};
  
  /* Use flexbox to manage the layout of children */
  display: flex;
  flex-direction: column;

  /* Style the header */
  h3 {
    margin-top: 0;
    margin-bottom: ${({ theme }) => theme.gridUnit * 3}px;
    font-size: ${({ theme, headerFontSize }) =>
      theme.typography.sizes[headerFontSize || 'xl']}px;
    font-weight: ${({ theme, boldText }) =>
      theme.typography.weights[boldText ? 'bold' : 'normal']};
    flex-shrink: 0; /* Prevent the header from shrinking */
  }

  /* This container will hold the table and will grow to fill space and scroll */
  .table-container {
    overflow: auto; /* Add scrollbars if the table is too big */
    flex-grow: 1; /* Allow the table container to grow and fill available space */
    min-height: 0; /* A flexbox trick to make scrolling work correctly in all browsers */
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  thead th {
    background-color: ${({ theme }) => theme.colors.primary.base};
    color: ${({ theme }) => theme.colors.grayscale.light5};
    position: sticky; /* Makes headers stick to the top when you scroll */
    top: 0;
    z-index: 1;
  }
  
  /* Other table styles remain the same */
  th, td { border: 1px solid ${({ theme }) =>
    theme.colors.grayscale.light2}; padding: ${({ theme }) =>
    theme.gridUnit * 2}px; text-align: left; white-space: nowrap; }
  tfoot td { font-weight: ${({ theme }) =>
    theme.typography.weights.bold}; background-color: ${({ theme }) =>
    theme.colors.grayscale.light3}; }
  tbody tr:nth-of-type(even) { background-color: ${({ theme }) =>
    theme.colors.grayscale.light4}; }
  
  /* Style the pagination controls at the bottom */
  .pagination-container {
    padding-top: ${({ theme }) => theme.gridUnit * 2}px;
    text-align: center;
    flex-shrink: 0; /* Prevent pagination from shrinking */
  }
  .pagination-container button { margin: 0 5px; padding: 5px 10px; border-radius: 4px; border: 1px solid ${({
    theme,
  }) => theme.colors.primary.base}; cursor: pointer; }
  .pagination-container button:disabled { cursor: not-allowed; opacity: 0.5; }
`;

// --- All of your functions and component logic below remains UNCHANGED ---

function refreshData(
  setDataMask: SupersetPluginRealtimeTableProps['setDataMask'],
) {
  setDataMask?.({
    filterState: {},
    ownState: {
      refresh: Date.now(),
      currentPage: 0,
      pageSize: 50,
    },
  });
}

export default function SupersetPluginRealtimeTable(
  props: SupersetPluginRealtimeTableProps,
) {
  const {
    data,
    height,
    width,
    formData,
    queriesData,
    setDataMask,
    headerText = 'Table',
    headerFontSize = 'xl',
    boldText = true,
    refreshInterval = 0,
  } = props;

  // Your duplicate useEffect that you had commented out is removed.
  // This is the one you provided.
  useEffect(() => {
    const intervalSeconds = Number(refreshInterval);
    if (!setDataMask || Number.isNaN(intervalSeconds) || intervalSeconds <= 0) {
      return undefined;
    }
    const id = setInterval(() => {
      refreshData(setDataMask);
    }, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [refreshInterval, setDataMask]);

  if (!formData || !queriesData) {
    return (
      <Styles
        height={height}
        width={width}
        headerFontSize={headerFontSize}
        boldText={boldText}
      >
        <h3>Loading...</h3>
      </Styles>
    );
  }

  const mainData = data ?? [];
  const headers = mainData.length > 0 ? Object.keys(mainData[0]) : [];
  const rowCountQuery = queriesData.find(q => q.is_rowcount);
  const totalRecords = rowCountQuery?.data?.[0]
    ? (Object.values(rowCountQuery.data[0])[0] as number)
    : mainData.length;
  const totalsQuery = queriesData.find(
    q => q.is_rowcount !== true && q.groupby?.length === 0,
  );
  const totalsData = totalsQuery?.data?.[0];
  const [currentPage, setCurrentPage] = useState(0);
  const pageSize = formData.server_page_length || 50;
  const pageCount = totalRecords > 0 ? Math.ceil(totalRecords / pageSize) : 1;
  
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      setDataMask?.({
        ownState: { currentPage: newPage, pageSize },
      });
    },
    [pageSize, setDataMask],
  );

  if (mainData.length === 0) {
    return (
      <Styles
        height={height}
        width={width}
        headerFontSize={headerFontSize}
        boldText={boldText}
      >
        <h3>{headerText}</h3>
        <p>No data</p>
      </Styles>
    );
  }

  // The main render output now uses the flexbox layout
  return (
    <Styles
      height={height}
      width={width}
      headerFontSize={headerFontSize}
      boldText={boldText}
    >
      <h3>{headerText} Row Count: {data.length} | RefreshInterval: {refreshInterval}</h3>

      {/* This new div will handle the scrolling */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              {headers.map(header => <th key={header}>{header}</th>)}
            </tr>
          </thead>
          <tbody>
            {mainData.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map(header => (
                  <td key={`${rowIndex}-${header}`}>{String(row[header] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
          {totalsData && (
            <tfoot>
              <tr>
                {headers.map((header, index) => (
                  <td key={`total-${header}`}>
                    {index === 0 ? 'Total' : String(totalsData[header] ?? '')}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {formData.server_pagination && totalRecords > 0 && (
        <div className="pagination-container">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 0}
          >
            ← Previous
          </button>
          <span>
            {' '}
            Page {currentPage + 1} of {pageCount} ({totalRecords} records){' '}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= pageCount - 1}
          >
            Next →
          </button>
        </div>
      )}
    </Styles>
  );
}