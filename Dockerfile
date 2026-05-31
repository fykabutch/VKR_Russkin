ARG BUILD_CONFIGURATION=Release

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 5454
ENV ASPNETCORE_URLS=http://+:5454
ENV ConnectionStrings__DefaultConnection="Data Source=/app/data/VKR_Russkin.db"
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS restore
WORKDIR /src
COPY ["VKR_Russkin.sln", "./"]
COPY ["VKR_Russkin/VKR_Russkin.csproj", "VKR_Russkin/"]
RUN dotnet restore "VKR_Russkin/VKR_Russkin.csproj"

FROM restore AS build
ARG BUILD_CONFIGURATION
WORKDIR /src
COPY . .
WORKDIR /src/VKR_Russkin
RUN dotnet build "VKR_Russkin.csproj" -c "$BUILD_CONFIGURATION" -o /app/build --no-restore

FROM build AS publish
ARG BUILD_CONFIGURATION
RUN dotnet publish "VKR_Russkin.csproj" -c "$BUILD_CONFIGURATION" -o /app/publish --no-restore /p:UseAppHost=false

FROM base AS final
WORKDIR /app
RUN mkdir -p /app/data /app/seed \
    && chown -R "$APP_UID:$APP_UID" /app
COPY --from=publish --chown=$APP_UID:$APP_UID /app/publish ./
COPY --chown=$APP_UID:$APP_UID ["VKR_Russkin/VKR_Russkin.db", "/app/seed/VKR_Russkin.db"]
USER $APP_UID
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail http://localhost:5454/health || exit 1
ENTRYPOINT ["sh", "-c", "mkdir -p /app/data && if [ ! -f /app/data/VKR_Russkin.db ]; then cp /app/seed/VKR_Russkin.db /app/data/VKR_Russkin.db; fi && exec dotnet VKR_Russkin.dll"]
