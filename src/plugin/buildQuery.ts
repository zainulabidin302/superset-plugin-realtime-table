/**
 * This is a full-featured buildQuery function that handles advanced features
 * for a table chart, including Query Modes, Time Comparisons, Percent Metrics,
 * Server-Side Pagination, and Grand Totals.
 *
 * It is structured to cleanly separate the logic for 'Raw' and 'Aggregate'
 * modes to prevent bugs and ensure each mode gets a correctly formed query.
 */
import {
  buildQueryContext,
  QueryObject,
  QueryMode,
  ensureIsArray,
  getMetricLabel,
  removeDuplicates,
  PostProcessingRule,
} from '@superset-ui/core';
import {
  isTimeComparison,
  timeCompareOperator,
  timeCompareSuffix,
} from '@superset-ui/chart-controls';
import { BuildQuery } from '@superset-ui/core/src/chart/registries/ChartBuildQueryRegistrySingleton';
import { RealtimeTableFormData } from './types';

/**
 * Determines the query mode (Aggregate or Raw) based on the form data.
 */
function getQueryMode(formData: RealtimeTableFormData): QueryMode {
  const { query_mode: mode } = formData;
  if (mode === QueryMode.Aggregate || mode === QueryMode.Raw) {
    return mode;
  }
  
  //
  // --> THIS IS THE FIX: Check for both camelCase and snake_case <--
  //
  // Superset's formData can be inconsistent. We check for both property names
  // to reliably determine if raw columns have been selected.
  const rawColumns = formData.all_columns || formData.allColumns;
  const hasRawColumns = rawColumns && rawColumns.length > 0;
  
  return hasRawColumns ? QueryMode.Raw : QueryMode.Aggregate;
}

// The rest of the file is the same as the previous "final" version.
// The only change needed was in the getQueryMode helper function above.

const buildQuery: BuildQuery<RealtimeTableFormData> = (
  formData: RealtimeTableFormData,
  options,
) => {
  const queryMode = getQueryMode(formData);

  return buildQueryContext(formData, baseQueryObject => {
    let queryObject: QueryObject;
    const isAggMode = queryMode === QueryMode.Aggregate;
    const extraQueries: QueryObject[] = [];

    if (isAggMode) {
      // --- AGGREGATE MODE LOGIC ---
      let { metrics, orderby = [], columns = [] } = baseQueryObject;
      const postProcessing: PostProcessingRule[] = [];
      const { percent_metrics: percentMetrics, order_desc: orderDesc = false } =
        formData;

      const sortByMetric = ensureIsArray(formData.timeseries_limit_metric)[0];
      if (sortByMetric) {
        orderby = [[sortByMetric, !orderDesc]];
      } else if (metrics && metrics.length > 0) {
        orderby = [[metrics[0], !orderDesc]];
      }

      const timeOffsets = ensureIsArray(formData.time_compare);
      if (isTimeComparison(formData, baseQueryObject)) {
        postProcessing.push(timeCompareOperator(formData, baseQueryObject));
      }

      if (percentMetrics && percentMetrics.length > 0) {
        const percentMetricLabels = removeDuplicates(
          percentMetrics.map(getMetricLabel),
        );
        const allPercentMetricLabels = isTimeComparison(
          formData,
          baseQueryObject,
        )
          ? percentMetricLabels.reduce(
              (acc, metric) =>
                acc.concat([
                  metric,
                  ...timeOffsets.map(offset =>
                    timeCompareSuffix(metric, offset),
                  ),
                ]),
              [] as string[],
            )
          : percentMetricLabels;

        postProcessing.push({
          operation: 'contribution',
          options: {
            columns: allPercentMetricLabels,
            rename_columns: allPercentMetricLabels.map(x => `%${x}`),
          },
        });
        metrics = removeDuplicates(
          (metrics || []).concat(percentMetrics),
          getMetricLabel,
        );
      }
      queryObject = {
        ...baseQueryObject,
        columns,
        metrics,
        orderby,
        post_processing: postProcessing,
      };
    } else {
      // --- RAW MODE LOGIC ---
      queryObject = {
        ...baseQueryObject,
        orderby: formData.order_by_cols?.map(col => JSON.parse(col)),
      };
    }

    const { server_pagination: serverPagination } = formData;
    if (serverPagination) {
      const ownState = options?.ownState ?? {};
      queryObject.row_limit = ownState.pageSize ?? formData.server_page_length;
      queryObject.row_offset =
        (ownState.currentPage ?? 0) * (ownState.pageSize ?? 0);

      const cachedFilters = options?.extras?.cachedChanges?.[formData.slice_id];
      if (
        cachedFilters &&
        JSON.stringify(cachedFilters) !== JSON.stringify(queryObject.filters)
      ) {
        queryObject.row_offset = 0;
      }
      options?.hooks?.setCachedChanges?.({
        [formData.slice_id]: queryObject.filters,
      });
    }

    if (isAggMode && formData.show_totals) {
      extraQueries.push({
        ...queryObject,
        columns: [],
        row_limit: 0,
        row_offset: 0,
        post_processing: [],
        orderby: [],
      });
    }

    if (serverPagination) {
      return [
        queryObject,
        {
          ...queryObject,
          is_rowcount: true,
          row_limit: 0,
          row_offset: 0,
          columns: [],
          metrics: [],
          post_processing: [],
          orderby: [],
        },
        ...extraQueries,
      ];
    }

    return [queryObject, ...extraQueries];
  });
};


export const cachedBuildQuery = (): BuildQuery<RealtimeTableFormData> => {
  let cachedChanges: any = {};
  const setCachedChanges = (newChanges: any) => {
    cachedChanges = { ...cachedChanges, ...newChanges };
  };

  return (formData, options) =>
    buildQuery(
      { ...formData },
      {
        ...options,
        extras: { ...options?.extras, cachedChanges },
        hooks: {
          ...options?.hooks,
          setCachedChanges,
        },
      },
    );
};

export default cachedBuildQuery();