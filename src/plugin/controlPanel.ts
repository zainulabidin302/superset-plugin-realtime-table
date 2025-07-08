import { t, validateNonEmpty, QueryMode } from '@superset-ui/core';
import {
  ControlPanelConfig,
  sections,
  sharedControls,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        // Query Mode
        [
          {
            name: 'query_mode',
            config: {
              type: 'SelectControl',
              label: t('Query Mode'),
              choices: [
                [QueryMode.Aggregate, 'Aggregate'],
                [QueryMode.Raw, 'Raw Records'],
              ],
              default: QueryMode.Aggregate,
              description: t('Switch between aggregating data and viewing raw records.'),
            },
          },
        ],

        // === Aggregate Mode Controls ===
        ['groupby'],
        ['metrics'],
        ['percent_metrics'],

        // === Raw Mode Controls ===
        [
          {
            name: 'all_columns',
            config: {
              ...sharedControls.groupby,
              label: t('Columns (Raw)'),
              description: t('Columns to display in Raw Records mode.'),
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'order_by_cols',
            config: {
              type: 'SelectControl',
              label: t('Sort by (Raw)'),
              description: t('Column(s) to sort by in Raw Records mode. The order of selection matters.'),
              multi: true,
              // Dynamically generate choices: (e.g., "name asc", "name desc")
              mapStateToProps: ({ datasource }) => ({
                choices: datasource?.columns?.flatMap(c => [
                  [JSON.stringify([c.column_name, true]), `${c.column_name} (asc)`],
                  [JSON.stringify([c.column_name, false]), `${c.column_name} (desc)`],
                ]),
              }),
            },
          },
        ],

        // === Common Controls ===
        ['adhoc_filters'],
        ['timeseries_limit_metric', 'order_desc'], // Sorting for Aggregate mode
        ['time_compare'],
        ['show_totals'],
        ['server_pagination', 'server_page_length'],
        ['row_limit'],
      ],
    },
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        ['header_text'],
        [
          {
            name: 'refresh_interval',
            config: {
              type: 'SelectControl',
              label: t('Refresh Interval'),
              renderTrigger: true,
              default: '0',
              choices: [
                ['0', 'Off'],
                ['1', '1 seconds'],
                ['2', '2 seconds'],
                ['5', '5 seconds'],
                ['10', '10 seconds'],
                ['30', '30 seconds'],
                ['60', '1 minute'],
              ],
              description: t('Set the interval for automatic chart refresh. Set to "Off" to disable.'),
            },
          },
        ],
        [
          {
            name: 'header_text_color',
            config: {
              type: 'SelectControl',
              label: t('Header Color'),
              renderTrigger: true,
              default: 'black',
              choices: [
                ['black', 'Black'],
                ['#FFFFFF', 'White'],
                ['#0000FF', 'Blue'],
                ['red', 'Red'],
              ],
              description: t('Choose the color for the header text.'),
            },
          },
        ],
        [
          {
            name: 'bold_text',
            config: {
              type: 'CheckboxControl',
              label: t('Bold Text'),
              renderTrigger: true,
              default: true,
              description: t('A checkbox to make the header text bold.'),
            },
          },
        ],
        [
          {
            name: 'header_font_size',
            config: {
              type: 'SelectControl',
              label: t('Font Size'),
              default: 'xl',
              choices: [
                ['xxs', 'xx-small'],
                ['xs', 'x-small'],
                ['s', 'small'],
                ['m', 'medium'],
                ['l', 'large'],
                ['xl', 'x-large'],
                ['xxl', 'xx-large'],
              ],
              renderTrigger: true,
              description: t('The size of your header font.'),
            },
          },
        ],
      ],
    },
  ],

  // `controlOverrides` manages the dynamic visibility of all controls.
  controlOverrides: {
    // --- Overrides based on Query Mode ---
    groupby: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    metrics: {
      validators: [validateNonEmpty],
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    percent_metrics: {
      label: t('Percentage Metrics'),
      description: t('Metrics for which to display percentage of total. Only applies to Aggregate mode.'),
      validators: [],
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    timeseries_limit_metric: {
      label: t('Sort by (Aggregate)'),
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    order_desc: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    time_compare: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    show_totals: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Aggregate,
    },
    
    // --- Raw Mode Controls ---
    all_columns: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Raw,
    },
    order_by_cols: {
      visibility: ({ form_data }) => form_data?.query_mode === QueryMode.Raw,
    },

    // --- Other Dynamic Controls ---
    server_page_length: {
      visibility: ({ form_data }) => !!form_data?.server_pagination,
    },
  },
};

export default config;