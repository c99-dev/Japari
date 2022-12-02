import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/modules/prisma/prisma.service";
import { User } from "@prisma/client";
import { Request } from "express";
import { JWT_SECRET_KEY } from "src/constants/config";

interface JwtPayload {
  userId: number;
}

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, "jwt-access-token") {
  constructor(private prisma: PrismaService) {
    super({
      secretOrKey: JWT_SECRET_KEY,
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          return req.cookies["jwt-access-token"];
        },
      ]),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { userId } = payload;
    const user = await this.prisma.user.findUnique({
      where: { userId },
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
