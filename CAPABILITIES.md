# FXMacroData capabilities

The included contract snapshot contains 23 documented REST operations and 49 hosted MCP tools. Public USD catalogue, indicator history and calendar requests require no API key. Other requests depend on the endpoint and your authorized access.

Each result preserves the FXMacroData payload, including original source metadata, units and timestamp fields. Market consensus, official projections and FXMacroData-generated predictions retain separate identities.

| Public contract operation | Native surface |
| --- | --- |
| REST `health` | `fxmacrodata_rest_health` Mastra tool |
| REST `ping` | `fxmacrodata_rest_ping` Mastra tool |
| REST `forex` | `fxmacrodata_rest_forex` Mastra tool |
| REST `intraday_reference_rates` | `fxmacrodata_rest_intraday_reference_rates` Mastra tool |
| REST `fx_sources` | `fxmacrodata_rest_fx_sources` Mastra tool |
| REST `fx_source_universe` | `fxmacrodata_rest_fx_source_universe` Mastra tool |
| REST `data_catalogue` | `fxmacrodata_rest_data_catalogue` Mastra tool |
| REST `release_calendar` | `fxmacrodata_rest_release_calendar` Mastra tool |
| REST `market_sessions` | `fxmacrodata_rest_market_sessions` Mastra tool |
| REST `rate_differentials` | `fxmacrodata_rest_rate_differentials` Mastra tool |
| REST `curves` | `fxmacrodata_rest_curves` Mastra tool |
| REST `financial_prices` | `fxmacrodata_rest_financial_prices` Mastra tool |
| REST `press_releases` | `fxmacrodata_rest_press_releases` Mastra tool |
| REST `risk_sentiment` | `fxmacrodata_rest_risk_sentiment` Mastra tool |
| REST `factors` | `fxmacrodata_rest_factors` Mastra tool |
| REST `event_predictions` | `fxmacrodata_rest_event_predictions` Mastra tool |
| REST `latest_announcements` | `fxmacrodata_rest_latest_announcements` Mastra tool |
| REST `indicator_history` | `fxmacrodata_rest_indicator_history` Mastra tool |
| REST `cot` | `fxmacrodata_rest_cot` Mastra tool |
| REST `latest_commodities` | `fxmacrodata_rest_latest_commodities` Mastra tool |
| REST `commodities` | `fxmacrodata_rest_commodities` Mastra tool |
| REST `announcement_changes` | `fxmacrodata_rest_announcement_changes` Mastra tool |
| REST `stream_events` | `fxmacrodata_rest_stream_events` Mastra tool |
| MCP `ping` | Automatically discovered native Mastra MCP tool |
| MCP `mcp_capabilities` | Automatically discovered native Mastra MCP tool |
| MCP `mcp_auth_guide` | Automatically discovered native Mastra MCP tool |
| MCP `subscribe_for_mcp_access` | Automatically discovered native Mastra MCP tool |
| MCP `data_catalogue` | Automatically discovered native Mastra MCP tool |
| MCP `risk_sentiment` | Automatically discovered native Mastra MCP tool |
| MCP `macro_news` | Automatically discovered native Mastra MCP tool |
| MCP `release_calendar` | Automatically discovered native Mastra MCP tool |
| MCP `release_calendar_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `event_predictions` | Automatically discovered native Mastra MCP tool |
| MCP `latest_announcements` | Automatically discovered native Mastra MCP tool |
| MCP `announcement_changes` | Automatically discovered native Mastra MCP tool |
| MCP `press_releases` | Automatically discovered native Mastra MCP tool |
| MCP `macro_factor` | Automatically discovered native Mastra MCP tool |
| MCP `fx_reference_sources` | Automatically discovered native Mastra MCP tool |
| MCP `fx_reference_universe` | Automatically discovered native Mastra MCP tool |
| MCP `fx_intraday_reference_rates` | Automatically discovered native Mastra MCP tool |
| MCP `rate_curve` | Automatically discovered native Mastra MCP tool |
| MCP `rate_differentials` | Automatically discovered native Mastra MCP tool |
| MCP `latest_commodities` | Automatically discovered native Mastra MCP tool |
| MCP `forex` | Automatically discovered native Mastra MCP tool |
| MCP `seasonality` | Automatically discovered native Mastra MCP tool |
| MCP `indicator_query` | Automatically discovered native Mastra MCP tool |
| MCP `plot_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `indicator_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `forex_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `commodities_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `cot_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `policy_rate_differential_visual_artifact` | Automatically discovered native Mastra MCP tool |
| MCP `macro_briefing_task` | Automatically discovered native Mastra MCP tool |
| MCP `indicator_intel_task` | Automatically discovered native Mastra MCP tool |
| MCP `pair_intel_task` | Automatically discovered native Mastra MCP tool |
| MCP `macro_heatmap_task` | Automatically discovered native Mastra MCP tool |
| MCP `policy_scenario_modeler_task` | Automatically discovered native Mastra MCP tool |
| MCP `macro_war_room_task` | Automatically discovered native Mastra MCP tool |
| MCP `event_impact_replay_task` | Automatically discovered native Mastra MCP tool |
| MCP `quant_scenario_lab_task` | Automatically discovered native Mastra MCP tool |
| MCP `known_at_time_task` | Automatically discovered native Mastra MCP tool |
| MCP `macro_regime_classifier_task` | Automatically discovered native Mastra MCP tool |
| MCP `release_risk_score_task` | Automatically discovered native Mastra MCP tool |
| MCP `portfolio_risk_engine_task` | Automatically discovered native Mastra MCP tool |
| MCP `fx_trade_setup_task` | Automatically discovered native Mastra MCP tool |
| MCP `fx_backtest_task` | Automatically discovered native Mastra MCP tool |
| MCP `macro_research_pack_task` | Automatically discovered native Mastra MCP tool |
| MCP `market_sessions` | Automatically discovered native Mastra MCP tool |
| MCP `cot_data` | Automatically discovered native Mastra MCP tool |
| MCP `commodities` | Automatically discovered native Mastra MCP tool |
| MCP `financial_prices` | Automatically discovered native Mastra MCP tool |
| MCP `official_dataset_family` | Automatically discovered native Mastra MCP tool |

Gloomberb exposes structured tables and a native macro chart-series provider. Hosted web third-party plugins are unsupported by Gloomberb. Mastra preserves native MCP artifact outputs; the consuming UI determines their visual rendering. Neither integration automatically executes trades or creates subscriptions.
