"use client";

import { useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Video } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
import Dashboard from '@uppy/react/dashboard';
import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

export default function UploadVideoNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();
  
  const [uppy, setUppy] = useState<Uppy | null>(null);
  
  useEffect(() => {
    if (!data?.videoUrl && !uppy) {
      const u = new Uppy({
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v']
        }
      });
      
      u.use(Transloadit, {
        assemblyOptions: {
          params: {
            auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || '' },
            steps: {
              export: {
                use: ":original",
                robot: "/video/encode",
                preset: "ipad-high"
              }
            }
          },
        },
        waitForEncoding: true
      });

      u.on('transloadit:complete', (assembly) => {
        const resultUrl = assembly.results?.['export']?.[0]?.ssl_url || assembly.results?.[':original']?.[0]?.ssl_url;
        if (resultUrl) {
          updateNodeData(id, { videoUrl: resultUrl });
        }
      });

      setUppy(u);
    }
    
    return () => {
      if (uppy) uppy.destroy();
    };
  }, [id, data?.videoUrl, updateNodeData]);

  return (
    <NodeWrapper id={id} title="Upload Video" icon={<Video size={16} className="text-[#6C63FF]" />} selected={selected}>
      {Boolean(data?.videoUrl) ? (
        <div className="flex flex-col gap-2">
          <video 
            src={data.videoUrl as string} 
            controls
            className="w-full h-auto max-h-[200px] rounded-md border border-[#333] bg-black"
          />
          <button 
            onClick={() => updateNodeData(id, { videoUrl: null })}
            className="text-xs text-gray-400 hover:text-white"
          >
            Upload different video
          </button>
        </div>
      ) : (
        <div className="uppy-dark-theme-override">
          {uppy ? (
            <Dashboard 
              uppy={uppy} 
              hideUploadButton={false} 
              width="100%" 
              height={200}
              proudlyDisplayPoweredByUppy={false}
              theme="dark"
            />
          ) : (
            <div className="h-[200px] flex items-center justify-center text-sm text-gray-500">
              Loading uploader...
            </div>
          )}
        </div>
      )}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="video"
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]"
      />
    </NodeWrapper>
  );
}
