"use client";

import { useState, useEffect } from "react";
import { Handle, Position, NodeProps, useReactFlow } from "@xyflow/react";
import { Image as ImageIcon } from "lucide-react";
import NodeWrapper from "./NodeWrapper";
import Uppy from '@uppy/core';
import Transloadit from '@uppy/transloadit';
import Dashboard from '@uppy/react/dashboard';

import '@uppy/core/css/style.min.css';
import '@uppy/dashboard/css/style.min.css';

export default function UploadImageNode(props: NodeProps) {
  const { id, data, selected } = props;
  const { updateNodeData } = useReactFlow();
  
  const [uppy, setUppy] = useState<Uppy | null>(null);
  
  useEffect(() => {
    // Only init if we don't already have an uploaded image
    if (!data?.imageUrl && !uppy) {
      const u = new Uppy({
        restrictions: {
          maxNumberOfFiles: 1,
          allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        }
      });
      
      u.use(Transloadit, {
        assemblyOptions: {
          params: {
            auth: { key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY || '' },
            steps: {
              export: {
                use: ":original",
                robot: "/image/resize",
                width: 2000,
                height: 2000,
                resize_strategy: "fit"
              }
            }
          },
        },
        waitForEncoding: true
      });

      u.on('transloadit:complete', (assembly) => {
        // Find the result URL
        const resultUrl = assembly.results?.['export']?.[0]?.ssl_url || assembly.results?.[':original']?.[0]?.ssl_url;
        if (resultUrl) {
          updateNodeData(id, { imageUrl: resultUrl });
        }
      });

      setUppy(u);
    }
    
    return () => {
      if (uppy) uppy.destroy();
    };
  }, [id, data?.imageUrl, updateNodeData]);

  return (
    <NodeWrapper id={id} title="Upload Image" icon={<ImageIcon size={16} className="text-[#6C63FF]" />} selected={selected}>
      {Boolean(data?.imageUrl) ? (
        <div className="flex flex-col gap-2">
          <img 
            src={data.imageUrl as string} 
            alt="Uploaded" 
            className="w-full h-auto max-h-[200px] object-cover rounded-md border border-[#333]"
          />
          <button 
            onClick={() => updateNodeData(id, { imageUrl: null })}
            className="text-xs text-gray-400 hover:text-white"
          >
            Upload different image
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
        id="image"
        className="w-3 h-3 bg-[#6C63FF] border-2 border-[#1E1E2E]"
      />
    </NodeWrapper>
  );
}
