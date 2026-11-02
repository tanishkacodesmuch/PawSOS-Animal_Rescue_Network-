import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RescueCase } from '../../types/rescue';

interface RescueMapProps {
  cases?: RescueCase[];
  selectedCaseId?: string;
  center?: [number, number];
  zoom?: number;
  height?: string;
  interactiveMode?: 'display' | 'picker';
  onLocationSelect?: (lat: number, lng: number, address?: string) => void;
  showRescuerRoute?: boolean;
}

export const RescueMap: React.FC<RescueMapProps> = ({
  cases = [],
  selectedCaseId,
  center = [19.0760, 72.8777],
  zoom = 13,
  height = '420px',
  interactiveMode = 'display',
  onLocationSelect,
  showRescuerRoute = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapContainerRef.current, {
      center,
      zoom,
      zoomControl: true,
      scrollWheelZoom: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markerGroup = L.layerGroup().addTo(map);
    markerGroupRef.current = markerGroup;
    mapInstanceRef.current = map;

    // Handle picker mode click
    if (interactiveMode === 'picker') {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        if (pickerMarkerRef.current) {
          pickerMarkerRef.current.setLatLng([lat, lng]);
        } else {
          const pinHtml = `
            <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
              <div style="background-color: #E65353; color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(230,83,83,0.4); border: 2.5px solid #FFFFFF;">
                <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">📍</span>
              </div>
            </div>
          `;
          const customIcon = L.divIcon({
            html: pinHtml,
            className: 'custom-picker-pin',
            iconSize: [34, 34],
            iconAnchor: [17, 34],
          });
          pickerMarkerRef.current = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map);
          pickerMarkerRef.current.on('dragend', () => {
            const newPos = pickerMarkerRef.current?.getLatLng();
            if (newPos && onLocationSelect) {
              onLocationSelect(newPos.lat, newPos.lng);
            }
          });
        }
        if (onLocationSelect) {
          onLocationSelect(lat, lng);
        }
      });
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update center & zoom if changed
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Update Markers when cases change
  useEffect(() => {
    if (!mapInstanceRef.current || !markerGroupRef.current) return;
    if (interactiveMode === 'picker') return;

    markerGroupRef.current.clearLayers();

    if (cases.length === 0) return;

    const bounds = L.latLngBounds([]);

    cases.forEach((item) => {
      if (!item.lat || !item.lng) return;

      const isSelected = item.id === selectedCaseId;
      const pinColor = item.urgency === 'Critical' ? '#E65353' : item.urgency === 'High' ? '#F2B84B' : '#20A67A';

      const iconHtml = `
        <div style="transform: translate(-50%, -100%); cursor: pointer; display: flex; flex-direction: column; align-items: center;">
          <div style="background-color: ${pinColor}; color: white; width: ${isSelected ? '38px' : '30px'}; height: ${isSelected ? '38px' : '30px'}; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.25); border: 2.5px solid #FFFFFF;">
            <span style="transform: rotate(45deg); font-size: ${isSelected ? '14px' : '11px'}; font-weight: bold;">
              ${item.animalType === 'Dog' ? '🐕' : item.animalType === 'Cat' ? '🐈' : item.animalType === 'Cow' ? '🐄' : item.animalType === 'Bird' ? '🕊️' : '🐾'}
            </span>
          </div>
          <div style="margin-top: 4px; background: rgba(23, 43, 38, 0.88); color: #fff; font-size: 10px; font-weight: 600; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
            ${item.id} · ${item.urgency}
          </div>
        </div>
      `;

      const markerIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-case-marker',
        iconSize: [32, 42],
        iconAnchor: [16, 42],
      });

      const marker = L.marker([item.lat, item.lng], { icon: markerIcon });

      const popupContent = `
        <div style="min-width: 210px; font-family: Inter, sans-serif; padding: 4px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
            <span style="font-weight: 700; font-size: 13px; color: #145C4A;">${item.id}</span>
            <span style="font-size: 11px; padding: 2px 6px; border-radius: 4px; background-color: ${item.urgency === 'Critical' ? '#FEE2E2; color: #DC2626;' : '#FEF3C7; color: #D97706;'} font-weight: 600;">
              ${item.urgency}
            </span>
          </div>
          <p style="margin: 0 0 4px; font-size: 12px; font-weight: 600; color: #172B26;">${item.animalType} — ${item.condition}</p>
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748B;">📍 ${item.address}</p>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #E2E8F0; font-size: 11px; color: #145C4A; font-weight: 600;">
            Status: ${item.status}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      markerGroupRef.current?.addLayer(marker);
      bounds.extend([item.lat, item.lng]);

      if (isSelected && mapInstanceRef.current) {
        marker.openPopup();
      }
    });

    // If showing route for single selected case with rescuer
    if (showRescuerRoute && selectedCaseId) {
      const activeCase = cases.find((c) => c.id === selectedCaseId);
      if (activeCase && activeCase.assignedRescuer) {
        // Rescuer simulated coordinates (near Bandra depot)
        const rescuerLat = activeCase.lat + 0.012;
        const rescuerLng = activeCase.lng - 0.009;

        const rescuerIcon = L.divIcon({
          html: `
            <div style="background-color: #145C4A; color: white; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(20,92,74,0.4); border: 2.5px solid white;">
              🚑
            </div>
          `,
          className: 'rescuer-vehicle-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const rescuerMarker = L.marker([rescuerLat, rescuerLng], { icon: rescuerIcon });
        rescuerMarker.bindPopup(`
          <div style="font-size: 12px; font-family: Inter, sans-serif;">
            <strong>Responder: ${activeCase.assignedRescuer.name}</strong><br/>
            ${activeCase.assignedRescuer.etaMinutes ? `ETA: ~${activeCase.assignedRescuer.etaMinutes} mins` : 'Status: Dispatched to location'}
          </div>
        `);
        markerGroupRef.current.addLayer(rescuerMarker);

        // Add connecting dashed path
        if (routeLineRef.current) {
          routeLineRef.current.remove();
        }
        const routeCoords: [number, number][] = [
          [rescuerLat, rescuerLng],
          [activeCase.lat + 0.005, activeCase.lng - 0.004],
          [activeCase.lat, activeCase.lng],
        ];
        const line = L.polyline(routeCoords, {
          color: '#20A67A',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(mapInstanceRef.current);
        routeLineRef.current = line;

        bounds.extend([rescuerLat, rescuerLng]);
      }
    }

    if (cases.length > 1 && bounds.isValid() && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [cases, selectedCaseId, interactiveMode, showRescuerRoute]);

  // Initial placement if in picker mode and center provided
  useEffect(() => {
    if (interactiveMode === 'picker' && mapInstanceRef.current && center) {
      if (!pickerMarkerRef.current) {
        const pinHtml = `
          <div style="transform: translate(-50%, -100%); display: flex; flex-direction: column; align-items: center;">
            <div style="background-color: #E65353; color: white; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(230,83,83,0.4); border: 2.5px solid #FFFFFF;">
              <span style="transform: rotate(45deg); font-size: 14px; font-weight: bold;">📍</span>
            </div>
          </div>
        `;
        const customIcon = L.divIcon({
          html: pinHtml,
          className: 'custom-picker-pin',
          iconSize: [34, 34],
          iconAnchor: [17, 34],
        });
        pickerMarkerRef.current = L.marker(center, { icon: customIcon, draggable: true }).addTo(mapInstanceRef.current);
        pickerMarkerRef.current.on('dragend', () => {
          const newPos = pickerMarkerRef.current?.getLatLng();
          if (newPos && onLocationSelect) {
            onLocationSelect(newPos.lat, newPos.lng);
          }
        });
      } else {
        pickerMarkerRef.current.setLatLng(center);
      }
    }
  }, [interactiveMode, center]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {interactiveMode === 'picker' && (
        <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm text-xs font-medium text-slate-700 pointer-events-none">
          Click or drag pin to pin emergency location
        </div>
      )}
    </div>
  );
};
