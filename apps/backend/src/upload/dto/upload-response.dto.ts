import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({ description: '文件名', example: 'example.jpg' })
  filename: string;

  @ApiProperty({ description: '原始文件名', example: 'my-photo.jpg' })
  originalName: string;

  @ApiProperty({
    description: '文件访问URL',
    example: 'http://localhost:3000/uploads/2023/12/25/abc123.jpg',
  })
  url: string;

  @ApiProperty({ description: '文件大小（字节）', example: 1024000 })
  size: number;
}
