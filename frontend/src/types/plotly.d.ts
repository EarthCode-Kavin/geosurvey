declare module "react-plotly.js" {
    import { Component } from "react";

    interface PlotParams {
        data: Plotly.Data[];
        layout?: Partial<Plotly.Layout>;
        config?: Partial<Plotly.Config>;
        style?: React.CSSProperties;
        className?: string;
        useResizeHandler?: boolean;
        onInitialized?: (figure: { data: Plotly.Data[]; layout: Partial<Plotly.Layout> }, graphDiv: HTMLElement) => void;
        onUpdate?: (figure: { data: Plotly.Data[]; layout: Partial<Plotly.Layout> }, graphDiv: HTMLElement) => void;
    }

    class Plot extends Component<PlotParams> { }
    export default Plot;
}

declare module "plotly.js-dist-min" {
    import * as Plotly from "plotly.js";
    export = Plotly;
}
