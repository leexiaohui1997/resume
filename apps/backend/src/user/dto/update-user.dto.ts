import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, Length, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    description: '头像URL',
    required: false,
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: '头像URL格式不正确' })
  @MaxLength(255, { message: '头像URL最多255个字符' })
  avatarUrl?: string;

  @ApiProperty({ description: '昵称', required: false, example: '小明' })
  @IsOptional()
  @IsString()
  @Length(2, 20, { message: '昵称长度必须在2到20个字符之间' })
  nickname?: string;
}
