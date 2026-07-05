import { notFound } from "next/navigation";
import { NOTEBOOKS } from "@/lib/notebooks";
import ResistivityNotebook from "@/components/notebooks/ResistivityNotebook";
import SeismicNotebook from "@/components/notebooks/SeismicNotebook";
import GprNotebook from "@/components/notebooks/GprNotebook";
import PotentialFieldsNotebook from "@/components/notebooks/PotentialFieldsNotebook";
import EffectiveStressNotebook from "@/components/notebooks/EffectiveStressNotebook";

const COMPONENTS: Record<string, React.ComponentType> = {
  resistivity: ResistivityNotebook,
  seismic: SeismicNotebook,
  gpr: GprNotebook,
  "potential-fields": PotentialFieldsNotebook,
  "effective-stress": EffectiveStressNotebook,
};

export function generateStaticParams() {
  return NOTEBOOKS.map((nb) => ({ slug: nb.slug }));
}

export default async function NotebookPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Component = COMPONENTS[slug];
  if (!Component) notFound();
  return <Component />;
}
