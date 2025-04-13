<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class PictureResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array
     */
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'filename' => $this->filename,
            'path' => $this->path,
            'thumbnail_path' => $this->thumbnail_path,
            'file_size' => $this->file_size,
            'mime_type' => $this->mime_type,
            'url' => $this->url ?? url('storage/' . $this->path),
            'thumbnail_url' => $this->thumbnail_url ?? ($this->thumbnail_path ? url('storage/' . $this->thumbnail_path) : null),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
