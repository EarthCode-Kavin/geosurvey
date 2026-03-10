"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useMemo } from "react";
import * as THREE from "three";

interface SubsurfaceViewerProps {
    data: Record<string, unknown>;
}

function SubsurfaceMesh({ meshData }: { meshData: { positions: number[]; indices: number[]; colors: number[] } }) {
    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(meshData.positions, 3));
        geo.setIndex(meshData.indices);
        geo.setAttribute("color", new THREE.Float32BufferAttribute(meshData.colors, 3));
        geo.computeVertexNormals();
        return geo;
    }, [meshData]);

    return (
        <mesh geometry={geometry}>
            <meshStandardMaterial vertexColors side={THREE.DoubleSide} />
        </mesh>
    );
}

export default function SubsurfaceViewer({ data }: SubsurfaceViewerProps) {
    const meshData = (data as { threejs_data?: { positions: number[]; indices: number[]; colors: number[] } })?.threejs_data
        || (data as { mesh_3d?: { positions: number[]; indices: number[]; colors: number[] } })?.mesh_3d;

    if (!meshData || !meshData.positions?.length) {
        return (
            <div style={{ height: 400, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
                No 3D mesh data available.
            </div>
        );
    }

    return (
        <div style={{ height: 400, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border-color)" }} id="subsurface-viewer">
            <Canvas camera={{ position: [50, 30, 50], fov: 50 }}>
                <ambientLight intensity={0.5} />
                <directionalLight position={[10, 10, 5]} intensity={1} />
                <SubsurfaceMesh meshData={meshData} />
                <OrbitControls enableDamping dampingFactor={0.1} />
                <gridHelper args={[100, 20, "#2d3a5c", "#1a2035"]} />
            </Canvas>
        </div>
    );
}
